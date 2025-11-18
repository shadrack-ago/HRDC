// Initialize demo data for the application
export const initDemoData = () => {
  // Check if demo user already exists
  const existingUsers = JSON.parse(localStorage.getItem('hrdc_users') || '[]')
  const demoUserExists = existingUsers.find(user => user.email === 'demo@hrdc.com')
  
  if (!demoUserExists) {
    const demoUser = {
      id: 'demo-user-001',
      email: 'demo@hrdc.com',
      password: 'demo123',
      firstName: 'Demo',
      lastName: 'User',
      company: 'HR Digital Consulting',
      role: 'HR Manager',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }
    
    const updatedUsers = [...existingUsers, demoUser]
    localStorage.setItem('hrdc_users', JSON.stringify(updatedUsers))
    
    // Create demo conversations for the demo user
    const demoConversations = [
      {
        id: 'demo-conv-001',
        title: 'GDPR Compliance Requirements',
        messages: [
          {
            id: 'msg-001',
            content: 'What are the key requirements for GDPR compliance in our HR processes?',
            sender: 'user',
            timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          },
          {
            id: 'msg-002',
            content: 'GDPR compliance in HR processes requires several key elements:\n\n1. **Lawful Basis**: Establish a lawful basis for processing employee data (usually contract or legitimate interest)\n\n2. **Data Minimization**: Only collect and process personal data that is necessary for specific HR purposes\n\n3. **Consent Management**: Where consent is required, ensure it\'s freely given, specific, informed, and withdrawable\n\n4. **Employee Rights**: Implement processes to handle data subject rights (access, rectification, erasure, portability)\n\n5. **Data Protection Impact Assessments**: Conduct DPIAs for high-risk processing activities\n\n6. **Privacy by Design**: Build data protection into your HR systems and processes from the start\n\n7. **Record Keeping**: Maintain detailed records of processing activities and data flows\n\n8. **Staff Training**: Ensure HR staff understand GDPR requirements and data handling procedures\n\nWould you like me to elaborate on any of these areas?',
            sender: 'ai',
            timestamp: new Date(Date.now() - 86400000 + 60000).toISOString()
          }
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 + 60000).toISOString()
      },
      {
        id: 'demo-conv-002',
        title: 'Remote Work Policy Development',
        messages: [
          {
            id: 'msg-003',
            content: 'Help me create a comprehensive remote work policy for our company',
            sender: 'user',
            timestamp: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
          },
          {
            id: 'msg-004',
            content: 'I\'ll help you create a comprehensive remote work policy. Here\'s a structured approach:\n\n**1. Policy Scope & Eligibility**\n- Define who can work remotely\n- Specify eligible roles and positions\n- Set criteria for remote work approval\n\n**2. Work Arrangements**\n- Full-time vs. hybrid options\n- Core hours and availability requirements\n- Time zone considerations\n\n**3. Equipment & Technology**\n- Company-provided equipment policy\n- IT security requirements\n- Internet and connectivity standards\n\n**4. Workspace Requirements**\n- Home office setup standards\n- Health and safety considerations\n- Ergonomic requirements\n\n**5. Communication & Collaboration**\n- Required tools and platforms\n- Meeting protocols\n- Response time expectations\n\n**6. Performance Management**\n- Goal setting and tracking\n- Regular check-ins and reviews\n- Productivity measurements\n\n**7. Data Security & Confidentiality**\n- VPN requirements\n- Document handling procedures\n- Privacy considerations\n\nWould you like me to develop any specific section in detail?',
            sender: 'ai',
            timestamp: new Date(Date.now() - 43200000 + 120000).toISOString()
          }
        ],
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000 + 120000).toISOString()
      }
    ]
    
    localStorage.setItem('hrdc_chats_demo-user-001', JSON.stringify(demoConversations))
  }
}

// Call this function when the app starts
if (typeof window !== 'undefined') {
  initDemoData()
}
