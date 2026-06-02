export const seedPeerReview = {
  industryData: {
    yourIndustry: "Healthcare",
    peerCount: 127,
    avgDeploymentSize: "850 devices",
  },
  topProducts: [
    {
      name: "CTERA Portal",
      adoption: 98,
      trend: "+5%",
      description: "Core cloud storage platform",
      features: ["Multi-site sync", "Ransomware protection", "Global file locking"],
    },
    {
      name: "CTERA Edge Filer",
      adoption: 92,
      trend: "+8%",
      description: "Local edge storage appliance",
      features: ["Local caching", "Offline access", "Bandwidth optimization"],
    },
    {
      name: "CTERA Drive",
      adoption: 85,
      trend: "+12%",
      description: "Desktop sync client",
      features: ["Real-time sync", "Selective sync", "Version control"],
    },
    {
      name: "CTERA Drive Connect",
      adoption: 78,
      trend: "+15%",
      description: "Cloud-native drive mapping",
      features: ["Zero footprint", "Cross-platform", "Instant access"],
    },
  ],
  commonFeatures: [
    { name: "Ransomware Protection", usage: 94, critical: true },
    { name: "Global File Locking", usage: 89, critical: true },
    { name: "Multi-Site Collaboration", usage: 87, critical: false },
    { name: "Data Encryption", usage: 96, critical: true },
    { name: "Automated Backup", usage: 91, critical: true },
    { name: "Mobile Access", usage: 72, critical: false },
  ],
  deploymentPatterns: [
    {
      pattern: "Hybrid Cloud",
      percentage: 76,
      description: "On-premises edge filers with cloud portal",
    },
    {
      pattern: "Pure Cloud",
      percentage: 18,
      description: "Cloud-only deployment with drive clients",
    },
    {
      pattern: "Multi-Region",
      percentage: 6,
      description: "Distributed deployment across regions",
    },
  ],
}
