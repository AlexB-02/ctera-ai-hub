/** Portal PostgreSQL query — copy the export_json result for Customer Hub import. */
export const PORTAL_FEATURE_EXPORT_SQL = `WITH system_bo AS (
    SELECT
        bo.uid,
        bo.name,
        bo.xml_field,
        xmlparse(document bo.xml_field) AS xml_doc,
        d.calc_key_manager,
        d.calc_global_file_lock,
        d.calc_antivirus,
        d.calc_dlp
    FROM base_objects bo
    JOIN db d ON d.uid = bo.uid
    WHERE bo.type = 'com.ctera.db.objects.DBObj'
      AND bo.name = 'System'
      AND COALESCE(bo.is_deleted, false) = false
    LIMIT 1
),
sys AS (
    SELECT
        s.*,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="dnsSuffix"]/val/text()', s.xml_doc))[1]::text AS portal_dns_suffix,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="cteraZonesEnabled"]/val/text()', s.xml_doc))[1]::text AS zones_enabled,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="allowEmbeddingEndUserPortal"]/val/text()', s.xml_doc))[1]::text AS iframe_enabled,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="activeDirectorySettings"]/obj/att[@id="activeDirectoryMode"]/val/text()', s.xml_doc))[1]::text AS global_ad_mode,
        (xpath('//obj[@class="DB"]/att[@id="ssoType"]/val/text()', s.xml_doc))[1]::text AS global_admin_sso_type,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="disableGUIAdminLogin"]/val/text()', s.xml_doc))[1]::text AS disable_gui_admin_login,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="ACLParserIP"]/val/text()', s.xml_doc))[1]::text AS acl_parser_ip,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="ACLParserPort"]/val/text()', s.xml_doc))[1]::text AS acl_parser_port,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="enableEmailSending"]/val/text()', s.xml_doc))[1]::text AS smtp_enabled,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="smtpSettings"]/obj/att[@id="smtpHost"]/val/text()', s.xml_doc))[1]::text AS smtp_host,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="enableSMSSending"]/val/text()', s.xml_doc))[1]::text AS sms_enabled,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="logsSettings"]/obj/att[@id="syslogConfig"]/obj/att[@id="mode"]/val/text()', s.xml_doc))[1]::text AS syslog_mode,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="logsSettings"]/obj/att[@id="syslogConfig"]/obj/att[@id="server"]/val/text()', s.xml_doc))[1]::text AS syslog_server,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="logsSettings"]/obj/att[@id="extendedAuditLogSettings"]/obj/att[@id="enabled"]/val/text()', s.xml_doc))[1]::text AS audit_service_enabled,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="keyManagerSettings"]/obj/att[@id="integration"]/obj/att[@id="type"]/val/text()', s.xml_doc))[1]::text AS kms_type,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="insightConnectorSettings"]/obj/att[@id="enabled"]/val/text()', s.xml_doc))[1]::text AS insight_enabled,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="rolesSettings"]/obj/att[@id="readWriteAdminSettings"]/obj/att[@id="superUser"]/val/text()', s.xml_doc))[1]::text AS super_user_read_write,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="rolesSettings"]/obj/att[@id="readOnlyAdminSettings"]/obj/att[@id="superUser"]/val/text()', s.xml_doc))[1]::text AS super_user_read_only,
        (xpath('//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="rolesSettings"]/obj/att[@id="supportAdminSettings"]/obj/att[@id="superUser"]/val/text()', s.xml_doc))[1]::text AS super_user_support,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', (xpath('./att[@id="id"]/val/text()', rule))[1]::text,
                    'description', (xpath('./att[@id="description"]/val/text()', rule))[1]::text,
                    'logName', (xpath('./att[@id="logName"]/val/text()', rule))[1]::text,
                    'topic', (xpath('./att[@id="topic"]/val/text()', rule))[1]::text,
                    'minSeverity', (xpath('./att[@id="minSeverity"]/val/text()', rule))[1]::text,
                    'messageContent', (xpath('./att[@id="messageContent"]/val/text()', rule))[1]::text
                )
            )
            FROM unnest(
                xpath(
                    '//obj[@class="DB"]/att[@id="settings"]/obj[@class="SystemSettings"]/att[@id="alerts"]/list/obj[@class="AlertRule"]',
                    s.xml_doc
                )
            ) AS rule
        ) AS custom_log_based_alerts
    FROM system_bo s
),
persistent_ctx AS (
    SELECT jsonb_object_agg(pc.id::text, pc.text::jsonb) AS contexts
    FROM persistent_context pc
    WHERE pc.id IN (1, 2, 3, 4, 6)
),
microservices AS (
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'componentId', mm.component_id,
                'dependentServices', to_jsonb(mm.dependent_services),
                'startTime', mm.start_time
            )
            ORDER BY mm.component_id
        ),
        '[]'::jsonb
    ) AS items
    FROM microservices_management mm
),
server_roles AS (
    SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
            'uid', bo.uid,
            'name', bo.name,
            'displayName', bo.display_name,
            'defaultIp', s.default_ipaddr,
            'connected', s.connected,
            'mainDb', s.main_db,
            'catalogNode', s.is_catalog_node,
            'isApplicationServer', (xpath('//att[@id="isApplicationServer"]/val/text()', xmlparse(document bo.xml_field)))[1]::text,
            'isMessagingServer', (xpath('//att[@id="isMessagingServer"]/val/text()', xmlparse(document bo.xml_field)))[1]::text,
            'isThumbnailsServer', (xpath('//att[@id="isThumbnailsServer"]/val/text()', xmlparse(document bo.xml_field)))[1]::text,
            'renderingServer', (xpath('//att[@id="renderingServer"]/val/text()', xmlparse(document bo.xml_field)))[1]::text,
            'previewStatus', (xpath('//att[@id="previewStatus"]/val/text()', xmlparse(document bo.xml_field)))[1]::text,
            'replicationOf', (xpath('//att[@id="replicationSettings"]/obj/att[@id="replicationOf"]/val/text()', xmlparse(document bo.xml_field)))[1]::text,
            'backupToBucketStatus', (xpath('//att[@id="backupToBucket"]/obj/att[@id="status"]/val/text()', xmlparse(document bo.xml_field)))[1]::text,
            'xlogArchiveStatus', (xpath('//att[@id="replicationSettings"]/obj/att[@id="xlogArchive"]/obj/att[@id="status"]/val/text()', xmlparse(document bo.xml_field)))[1]::text,
            'streamingReplicationStatus', (xpath('//att[@id="replicationSettings"]/obj/att[@id="streamingReplication"]/obj/att[@id="status"]/val/text()', xmlparse(document bo.xml_field)))[1]::text,
            'platformServices', (xpath('//att[@id="platformServices"]/val/text()', xmlparse(document bo.xml_field)))[1]::text
        ) ORDER BY bo.name), '[]'::jsonb) AS all_servers,
        COALESCE(jsonb_agg(jsonb_build_object(
            'uid', bo.uid, 'name', bo.name, 'defaultIp', s.default_ipaddr, 'connected', s.connected
        )) FILTER (
            WHERE (xpath('//att[@id="isApplicationServer"]/val/text()', xmlparse(document bo.xml_field)))[1]::text = 'true'
        ), '[]'::jsonb) AS application_servers,
        COALESCE(jsonb_agg(jsonb_build_object(
            'uid', bo.uid, 'name', bo.name, 'defaultIp', s.default_ipaddr, 'connected', s.connected, 'mainDb', s.main_db
        )) FILTER (
            WHERE COALESCE(s.main_db, false) = true
        ), '[]'::jsonb) AS database_servers,
        COALESCE(jsonb_agg(jsonb_build_object(
            'uid', bo.uid, 'name', bo.name, 'defaultIp', s.default_ipaddr,
            'replicationOf', (xpath('//att[@id="replicationSettings"]/obj/att[@id="replicationOf"]/val/text()', xmlparse(document bo.xml_field)))[1]::text
        )) FILTER (
            WHERE COALESCE((xpath('//att[@id="replicationSettings"]/obj/att[@id="replicationOf"]/val/text()', xmlparse(document bo.xml_field)))[1]::text, '') <> ''
        ), '[]'::jsonb) AS database_replication_servers,
        COALESCE(jsonb_agg(jsonb_build_object(
            'uid', bo.uid, 'name', bo.name, 'defaultIp', s.default_ipaddr,
            'previewStatus', (xpath('//att[@id="previewStatus"]/val/text()', xmlparse(document bo.xml_field)))[1]::text,
            'renderingServer', (xpath('//att[@id="renderingServer"]/val/text()', xmlparse(document bo.xml_field)))[1]::text
        )) FILTER (
            WHERE COALESCE((xpath('//att[@id="previewStatus"]/val/text()', xmlparse(document bo.xml_field)))[1]::text, 'Disabled') <> 'Disabled'
               OR (xpath('//att[@id="renderingServer"]/val/text()', xmlparse(document bo.xml_field)))[1]::text = 'true'
               OR (xpath('//att[@id="isThumbnailsServer"]/val/text()', xmlparse(document bo.xml_field)))[1]::text = 'true'
        ), '[]'::jsonb) AS preview_servers,
        COALESCE(jsonb_agg(jsonb_build_object(
            'uid', bo.uid, 'name', bo.name,
            'xlogArchiveStatus', (xpath('//att[@id="replicationSettings"]/obj/att[@id="xlogArchive"]/obj/att[@id="status"]/val/text()', xmlparse(document bo.xml_field)))[1]::text
        )) FILTER (
            WHERE COALESCE((xpath('//att[@id="replicationSettings"]/obj/att[@id="xlogArchive"]/obj/att[@id="status"]/val/text()', xmlparse(document bo.xml_field)))[1]::text, '') <> ''
        ), '[]'::jsonb) AS db_archiving,
        COALESCE(jsonb_agg(jsonb_build_object(
            'uid', bo.uid, 'name', bo.name,
            'streamingReplicationStatus', (xpath('//att[@id="replicationSettings"]/obj/att[@id="streamingReplication"]/obj/att[@id="status"]/val/text()', xmlparse(document bo.xml_field)))[1]::text,
            'replicationOf', (xpath('//att[@id="replicationSettings"]/obj/att[@id="replicationOf"]/val/text()', xmlparse(document bo.xml_field)))[1]::text
        )) FILTER (
            WHERE COALESCE((xpath('//att[@id="replicationSettings"]/obj/att[@id="streamingReplication"]/obj/att[@id="status"]/val/text()', xmlparse(document bo.xml_field)))[1]::text, '') <> ''
               OR COALESCE((xpath('//att[@id="replicationSettings"]/obj/att[@id="replicationOf"]/val/text()', xmlparse(document bo.xml_field)))[1]::text, '') <> ''
        ), '[]'::jsonb) AS db_replication,
        COALESCE(jsonb_agg(jsonb_build_object(
            'uid', bo.uid, 'name', bo.name,
            'backupToBucketStatus', (xpath('//att[@id="backupToBucket"]/obj/att[@id="status"]/val/text()', xmlparse(document bo.xml_field)))[1]::text
        )) FILTER (
            WHERE COALESCE((xpath('//att[@id="backupToBucket"]/obj/att[@id="status"]/val/text()', xmlparse(document bo.xml_field)))[1]::text, '') <> ''
        ), '[]'::jsonb) AS backup_to_bucket
    FROM base_objects bo
    JOIN servers s ON s.uid = bo.uid
    WHERE COALESCE(bo.is_deleted, false) = false
),
messaging_service AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'uid', bo.uid,
        'name', bo.name,
        'serverName', srv_bo.name,
        'serverIp', srv.default_ipaddr,
        'runtimeInfo', ms.runtime_info::jsonb
    ) ORDER BY bo.name), '[]'::jsonb) AS items
    FROM base_objects bo
    JOIN messaging_servers ms ON ms.uid = bo.uid
    LEFT JOIN servers srv ON srv.uid = ms.server_id
    LEFT JOIN base_objects srv_bo ON srv_bo.uid = srv.uid
    WHERE COALESCE(bo.is_deleted, false) = false
),
portals AS (
    SELECT
        bo.uid,
        bo.name,
        bo.display_name,
        bo.type,
        xmlparse(document bo.xml_field) AS xml_doc
    FROM base_objects bo
    WHERE bo.type IN ('com.ctera.db.objects.TeamPortal', 'com.ctera.db.objects.ResellerPortal')
      AND COALESCE(bo.is_deleted, false) = false
),
tenant_settings AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'portalUid', p.uid,
        'portalName', p.name,
        'activeDirectory', jsonb_build_object(
            'connectorType', (xpath('//att[@id="directoryConnector"]/obj/att[@id="type"]/val/text()', p.xml_doc))[1]::text,
            'activeDirectoryMode', (xpath('//att[@id="settings"]/obj/att[@id="activeDirectorySettings"]/obj/att[@id="activeDirectoryMode"]/val/text()', p.xml_doc))[1]::text
        ),
        'accessBasedPresentation', jsonb_build_object(
            'enabled', (xpath('//att[@id="settings"]/obj/att[@id="enableAccessBasedEnumeration"]/val/text()', p.xml_doc))[1]::text
        ),
        'singleSignOn', jsonb_build_object(
            'ssoType', (xpath('//att[@id="ssoType"]/val/text()', p.xml_doc))[1]::text
        ),
        'superTenantUsers', jsonb_build_object(
            'readWriteSuperUser', (xpath('//att[@id="settings"]/obj/att[@id="readWriteAdminSettings"]/obj/att[@id="superUser"]/val/text()', p.xml_doc))[1]::text,
            'readOnlySuperUser', (xpath('//att[@id="settings"]/obj/att[@id="readOnlyAdminSettings"]/obj/att[@id="superUser"]/val/text()', p.xml_doc))[1]::text,
            'supportSuperUser', (xpath('//att[@id="settings"]/obj/att[@id="supportAdminSettings"]/obj/att[@id="superUser"]/val/text()', p.xml_doc))[1]::text
        ),
        'skins', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'uid', sk_bo.uid,
                'name', sk_bo.name,
                'customCss', sk.custom_css,
                'customLogin', sk.custom_login
            ) ORDER BY sk_bo.name), '[]'::jsonb)
            FROM base_objects sk_bo
            JOIN skins sk ON sk.uid = sk_bo.uid
            WHERE sk_bo.portal_id = p.uid
              AND COALESCE(sk_bo.is_deleted, false) = false
        ),
        'configurationTemplates', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'uid', dt.uid,
                'name', dt.name,
                'displayName', dt.display_name
            ) ORDER BY dt.name), '[]'::jsonb)
            FROM base_objects dt
            WHERE dt.portal_id = p.uid
              AND dt.type = 'com.ctera.db.objects.DeviceTemplate'
              AND COALESCE(dt.is_deleted, false) = false
        ),
        'buttonGenerator', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'skinUid', sk_bo.uid,
                'skinName', sk_bo.name,
                'customLogin', sk.custom_login
            ) ORDER BY sk_bo.name), '[]'::jsonb)
            FROM base_objects sk_bo
            JOIN skins sk ON sk.uid = sk_bo.uid
            WHERE sk_bo.portal_id = p.uid
              AND COALESCE(sk_bo.is_deleted, false) = false
              AND COALESCE(sk.custom_login, false) = true
        ),
        'emailTemplates', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', ct.id,
                'templateName', pt.name,
                'displayName', pt.display_name
            ) ORDER BY pt.name), '[]'::jsonb)
            FROM customized_templates ct
            JOIN predefined_templates pt ON pt.id = ct.template_id
            WHERE ct.portal_id = p.uid
        ),
        'teamsIntegration', jsonb_build_object(
            'note', 'No dedicated TeamsIntegration setting found in portal schema; verify external integration separately.'
        ),
        'globalFileLock', jsonb_build_object(
            'enabled', (xpath('//att[@id="settings"]/obj/att[@id="globalFileLockEnabled"]/val/text()', p.xml_doc))[1]::text,
            'calculatedGlobalFileLock', sys.calc_global_file_lock
        ),
        'officeOnline', jsonb_build_object(
            'enabled', (xpath('//att[@id="settings"]/obj/att[@id="officeOnlineSettings"]/obj/att[@id="enabled"]/val/text()', p.xml_doc))[1]::text,
            'discoveryUrl', (xpath('//att[@id="settings"]/obj/att[@id="officeOnlineSettings"]/obj/att[@id="discoveryUrl"]/val/text()', p.xml_doc))[1]::text
        ),
        'cloudDrivePolicy', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'position', r.auto_assignment_rule_pos,
                'allowed', r.allowed,
                'assignedTo', r.assigned_to
            ) ORDER BY r.auto_assignment_rule_pos), '[]'::jsonb)
            FROM cloud_drive_policy_rules r
            WHERE r.portal_id = p.uid
        ),
        'zonesEnabled', jsonb_build_object(
            'tenantOverride', (xpath('//att[@id="settings"]/obj/att[@id="cteraZonesEnabled"]/val/text()', p.xml_doc))[1]::text,
            'globalDefault', sys.zones_enabled
        ),
        'iframeEnabled', jsonb_build_object(
            'cspFrameAncestorsDomains', to_jsonb(
                xpath('//att[@id="settings"]/obj/att[@id="cspFrameAncestorsDomainsList"]/list/val/text()', p.xml_doc)::text[]
            )
        )
    ) ORDER BY p.name), '[]'::jsonb) AS items
    FROM portals p
    CROSS JOIN sys
),
global_skins AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'uid', bo.uid,
        'name', bo.name,
        'customCss', sk.custom_css,
        'customLogin', sk.custom_login
    ) ORDER BY bo.name), '[]'::jsonb) AS items
    FROM base_objects bo
    JOIN skins sk ON sk.uid = bo.uid
    WHERE bo.portal_id IS NULL
      AND COALESCE(bo.is_deleted, false) = false
),
global_firmware AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'uid', bo.uid,
        'name', bo.name,
        'displayName', bo.display_name
    ) ORDER BY bo.name), '[]'::jsonb) AS items
    FROM base_objects bo
    WHERE bo.type = 'com.ctera.db.objects.FirmwareImage'
      AND COALESCE(bo.is_deleted, false) = false
),
device_list AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'uid', bo.uid,
        'name', bo.name,
        'displayName', bo.display_name,
        'portalId', bo.portal_id,
        'deviceType', d.device_type,
        'disabled', d.disabled,
        'macAddress', d.mac_address
    ) ORDER BY bo.name), '[]'::jsonb) AS items
    FROM base_objects bo
    JOIN devices d ON d.uid = bo.uid
    WHERE COALESCE(bo.is_deleted, false) = false
),
features AS (
    SELECT jsonb_build_object(
        'Infrastructure', jsonb_build_array(
            jsonb_build_object('name', 'Application Server', 'data', (SELECT application_servers FROM server_roles)),
            jsonb_build_object('name', 'Database Server', 'data', (SELECT database_servers FROM server_roles)),
            jsonb_build_object('name', 'Database Replication Server', 'data', (SELECT database_replication_servers FROM server_roles)),
            jsonb_build_object('name', 'Preview Server', 'data', (SELECT preview_servers FROM server_roles)),
            jsonb_build_object('name', 'DB Archiving', 'data', (SELECT db_archiving FROM server_roles)),
            jsonb_build_object('name', 'DB Replication', 'data', (SELECT db_replication FROM server_roles)),
            jsonb_build_object('name', 'Backup to Bucket', 'data', jsonb_build_object(
                'servers', (SELECT backup_to_bucket FROM server_roles),
                'persistentContext', (SELECT contexts -> '6' FROM persistent_ctx)
            ))
        ),
        'Services', jsonb_build_array(
            jsonb_build_object('name', 'Syslog', 'data', jsonb_build_object(
                'mode', sys.syslog_mode,
                'server', sys.syslog_server,
                'persistentContext', (SELECT contexts -> '3' FROM persistent_ctx)
            )),
            jsonb_build_object('name', 'Edge Filer Syslog', 'data', jsonb_build_object(
                'persistentContext', (SELECT contexts -> '3' FROM persistent_ctx),
                'microservices', (SELECT items FROM microservices)
            )),
            jsonb_build_object('name', 'KMS', 'data', jsonb_build_object(
                'licensed', sys.calc_key_manager,
                'integrationType', sys.kms_type,
                'persistentContext', (SELECT contexts -> '1' FROM persistent_ctx)
            )),
            jsonb_build_object('name', 'Varonis', 'data', jsonb_build_object(
                'persistentContext', (SELECT contexts -> '2' FROM persistent_ctx)
            )),
            jsonb_build_object('name', 'SMTP', 'data', jsonb_build_object(
                'enabled', sys.smtp_enabled,
                'host', sys.smtp_host
            )),
            jsonb_build_object('name', 'SMS', 'data', jsonb_build_object(
                'enabled', sys.sms_enabled
            )),
            jsonb_build_object('name', 'Backup Service', 'data', jsonb_build_object(
                'messagingServers', (SELECT items FROM messaging_service),
                'messagingServersByRole', (
                    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'uid', bo.uid, 'name', bo.name, 'defaultIp', s.default_ipaddr
                    )), '[]'::jsonb)
                    FROM base_objects bo
                    JOIN servers s ON s.uid = bo.uid
                    WHERE COALESCE(bo.is_deleted, false) = false
                      AND (xpath('//att[@id="isMessagingServer"]/val/text()', xmlparse(document bo.xml_field)))[1]::text = 'true'
                )
            )),
            jsonb_build_object('name', 'Sync Service', 'data', jsonb_build_object(
                'messagingServers', (SELECT items FROM messaging_service),
                'platformServicesContext', (SELECT contexts -> '4' FROM persistent_ctx)
            )),
            jsonb_build_object('name', 'Audit Service', 'data', jsonb_build_object(
                'extendedAuditLogEnabled', sys.audit_service_enabled,
                'insightEnabled', sys.insight_enabled
            ))
        ),
        'Tenant Settings', jsonb_build_array(
            jsonb_build_object('name', 'Active Directory (AD)', 'data', (SELECT jsonb_path_query_array(items, '$[*].activeDirectory') FROM tenant_settings)),
            jsonb_build_object('name', 'Access Based Presentation (ABP)', 'data', (SELECT jsonb_path_query_array(items, '$[*].accessBasedPresentation') FROM tenant_settings)),
            jsonb_build_object('name', 'Single Sign On (SSO)', 'data', (SELECT jsonb_path_query_array(items, '$[*].singleSignOn') FROM tenant_settings)),
            jsonb_build_object('name', 'Super Tenant Users', 'data', (SELECT jsonb_path_query_array(items, '$[*].superTenantUsers') FROM tenant_settings)),
            jsonb_build_object('name', 'Skins', 'data', (SELECT jsonb_path_query_array(items, '$[*].skins') FROM tenant_settings)),
            jsonb_build_object('name', 'Configuration Templates', 'data', (SELECT jsonb_path_query_array(items, '$[*].configurationTemplates') FROM tenant_settings)),
            jsonb_build_object('name', 'Button Generator', 'data', (SELECT jsonb_path_query_array(items, '$[*].buttonGenerator') FROM tenant_settings)),
            jsonb_build_object('name', 'Email Templates', 'data', (SELECT jsonb_path_query_array(items, '$[*].emailTemplates') FROM tenant_settings)),
            jsonb_build_object('name', 'Teams Integration', 'data', (SELECT jsonb_path_query_array(items, '$[*].teamsIntegration') FROM tenant_settings)),
            jsonb_build_object('name', 'Global File Lock (GFL)', 'data', (SELECT jsonb_path_query_array(items, '$[*].globalFileLock') FROM tenant_settings)),
            jsonb_build_object('name', 'Office Online', 'data', (SELECT jsonb_path_query_array(items, '$[*].officeOnline') FROM tenant_settings)),
            jsonb_build_object('name', 'Cloud Drive Policy', 'data', (SELECT jsonb_path_query_array(items, '$[*].cloudDrivePolicy') FROM tenant_settings)),
            jsonb_build_object('name', 'Zones Enabled', 'data', (SELECT jsonb_path_query_array(items, '$[*].zonesEnabled') FROM tenant_settings))
        ),
        'Global Settings', jsonb_build_array(
            jsonb_build_object('name', 'iFrame Enabled', 'data', jsonb_build_object('allowEmbeddingEndUserPortal', sys.iframe_enabled)),
            jsonb_build_object('name', 'Global AD', 'data', jsonb_build_object('activeDirectoryMode', sys.global_ad_mode)),
            jsonb_build_object('name', 'Global Admin SSO', 'data', jsonb_build_object('ssoType', sys.global_admin_sso_type)),
            jsonb_build_object('name', 'Global Admin Access Control', 'data', jsonb_build_object(
                'disableGUIAdminLogin', sys.disable_gui_admin_login,
                'aclParserIp', sys.acl_parser_ip,
                'aclParserPort', sys.acl_parser_port
            )),
            jsonb_build_object('name', 'Firmware Repository', 'data', (SELECT items FROM global_firmware)),
            jsonb_build_object('name', 'Skins', 'data', (SELECT items FROM global_skins)),
            jsonb_build_object('name', 'Roles - Super User', 'data', jsonb_build_object(
                'readWriteAdmin', sys.super_user_read_write,
                'readOnlyAdmin', sys.super_user_read_only,
                'supportAdmin', sys.super_user_support
            )),
            jsonb_build_object('name', 'Custom Log Based Alerts', 'data', COALESCE(sys.custom_log_based_alerts, '[]'::jsonb))
        )
    ) AS by_category
    FROM sys
)
SELECT jsonb_pretty(
    jsonb_build_object(
        'exportedAt', to_jsonb(now()),
        'portalDnsSuffix', to_jsonb((SELECT portal_dns_suffix FROM sys)),
        'featureCount', 37,
        'features', (SELECT by_category FROM features),
        'deviceList', (SELECT items FROM device_list)
    )
) AS export_json;`
