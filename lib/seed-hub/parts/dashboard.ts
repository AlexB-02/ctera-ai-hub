export const seedDashboard = {
  myCteraSpaceLastUpdated: "1.1.2026",
  latestVersions: [
    { name: "Portal", version: "8.33", status: "up-to-date" as const, icon: "Server" },
    { name: "CTERA Edge Filer", version: "5.11.5100", status: "update-required" as const, icon: "HardDrive" },
    { name: "CTERA Drive", version: "6.11.100", status: "update-required" as const, icon: "Database" },
    { name: "CTERA Mobile App", version: "21.11.51", status: "up-to-date" as const, icon: "Smartphone" },
  ],
  newsItems: [
    {
      title: "New Portal Dashboard",
      description:
        "The dashboard has been redone to provide more portal monitoring as well as a section detailing the new features",
      category: "Operational Efficiency",
      image: "/images/dashboard-analytics.jpg",
      reason: "You're managing multiple portals and would benefit from improved monitoring capabilities.",
    },
    {
      title: "Upgrade Outdated Versions",
      description:
        "23 Edge Filer devices and 8 Drive Connect devices are running outdated versions. Upgrading will provide improved security, 15% performance enhancement, and new ransomware protection features.",
      category: "Security & Performance",
      image: "/images/network-upgrade.jpg",
      reason: "Multiple devices in your infrastructure require critical security updates and performance improvements.",
    },
    {
      title: "MCP",
      description:
        "Significantly improves productivity and IT operations, using natural language to streamline management tasks.",
      category: "Enterprise AI",
      image: "/images/mcp-workflow.jpg",
      reason: "Your infrastructure has multiple components that could benefit from streamlined management.",
    },
    {
      title: "Global File Locking",
      description:
        "Prevent file conflicts and improve team productivity. Optimal for multi-site collaboration across distributed teams.",
      category: "Workforce Productivity",
      image: "/images/global-network.jpg",
      reason: "You have devices across multiple locations, making file locking essential for collaboration.",
    },
  ],
  latestNewsItems: [
    {
      type: "ai-insight",
      title: "CTERA AI Insight",
      icon: "Sparkles",
      metric: "+43%",
      description: "Enhance efficiency with unified data management and security across all environments",
      primaryAction: "Generate Report",
      gradient: "from-primary to-primary/80",
    },
    {
      type: "data-intelligence",
      title: "CTERA Data Intelligence",
      icon: "Brain",
      metric: "2.8 PB",
      description:
        "Drive smarter decisions with advanced analytics and optimized data insights using the latest AI tools",
      primaryAction: "Start Discovering",
      gradient: "from-blue-600 to-cyan-600",
    },
    {
      type: "poll",
      title: "Your Opinion Matters",
      icon: "CheckSquare",
      metric: "",
      description:
        "We're constantly improving our platform with new features and capabilities. Help us shape the future of CTERA by sharing your thoughts on our latest innovations.",
      primaryAction: "I want to Participate!",
      gradient: "from-purple-600 to-purple-400",
    },
    {
      type: "newsletter",
      title: "CTERA Newsletter",
      icon: "Mail",
      metric: "",
      description: "Stay updated with the latest CTERA news, product updates, tech tips, and support reminders",
      primaryAction: "Read Latest Edition",
      gradient: "from-green-600 to-emerald-600",
    },
  ],
}
