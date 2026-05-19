export const generateJobDescription = async (brief: string): Promise<object> => {
  const title = brief.trim()
  const t = title.toLowerCase()

  let skills: string[] = ['Communication', 'Team collaboration', 'Problem solving', 'Git']
  let responsibilities: string[] = [
    `Design and develop solutions for ${title} role`,
    'Collaborate with cross-functional teams',
    'Write clean, maintainable code/documentation',
    'Participate in code/work reviews',
    'Troubleshoot and optimize performance',
  ]

  if (t.includes('react') || t.includes('frontend')) {
    skills = ['React.js', 'TypeScript', 'Redux', 'HTML/CSS', 'REST APIs', 'Git']
    responsibilities = ['Build reusable React components', 'Integrate REST APIs', 'Optimize web performance', 'Write unit tests', 'Collaborate with UI/UX designers']
  } else if (t.includes('node') || t.includes('backend')) {
    skills = ['Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'REST APIs', 'Docker']
    responsibilities = ['Design and build REST APIs', 'Manage databases', 'Implement authentication', 'Write tests', 'Deploy backend services']
  } else if (t.includes('python')) {
    skills = ['Python', 'Django/Flask', 'PostgreSQL', 'REST APIs', 'Docker', 'Git']
    responsibilities = ['Develop Python backend services', 'Design database schemas', 'Integrate third-party APIs', 'Write tests', 'Collaborate with frontend teams']
  } else if (t.includes('java')) {
    skills = ['Java 8+', 'Spring Boot', 'MySQL', 'REST APIs', 'Maven', 'Docker']
    responsibilities = ['Develop Spring Boot applications', 'Design microservices', 'Write JUnit tests', 'Optimize SQL queries', 'Architecture discussions']
  } else if (t.includes('devops') || t.includes('docker') || t.includes('aws')) {
    skills = ['Docker', 'Kubernetes', 'AWS/GCP', 'CI/CD', 'Terraform', 'Linux']
    responsibilities = ['Build CI/CD pipelines', 'Manage cloud infrastructure', 'Monitor systems', 'Automate deployments', 'Ensure security compliance']
  } else if (t.includes('data scientist') || t.includes('ml') || t.includes('machine learning')) {
    skills = ['Python', 'TensorFlow/PyTorch', 'Scikit-learn', 'SQL', 'Pandas', 'NumPy']
    responsibilities = ['Build ML models', 'Analyze datasets', 'Deploy models to production', 'Build data pipelines', 'Present findings']
  } else if (t.includes('data analyst')) {
    skills = ['SQL', 'Python/R', 'Tableau/Power BI', 'Excel', 'Statistics', 'Data visualization']
    responsibilities = ['Analyze business data', 'Build dashboards', 'Write complex SQL queries', 'Identify trends', 'Collaborate on KPIs']
  } else if (t.includes('hr') || t.includes('human resource')) {
    skills = ['Recruitment', 'HRMS tools', 'Employee relations', 'Payroll', 'MS Office', 'Communication']
    responsibilities = ['Manage recruitment process', 'Handle onboarding/offboarding', 'Maintain HR records', 'Coordinate performance reviews', 'Resolve employee queries']
  } else if (t.includes('product manager') || t.includes('pm')) {
    skills = ['Product roadmap', 'Agile/Scrum', 'Jira', 'Data analysis', 'Stakeholder management', 'Wireframing']
    responsibilities = ['Define product vision', 'Work with engineering and design', 'Write user stories', 'Analyze product metrics', 'Conduct user research']
  } else if (t.includes('mobile') || t.includes('flutter') || t.includes('android') || t.includes('ios')) {
    skills = ['Flutter/React Native', 'Dart/JavaScript', 'REST APIs', 'Firebase', 'App Store deployment', 'Git']
    responsibilities = ['Build mobile apps', 'Integrate REST APIs', 'Optimize app performance', 'Publish to stores', 'Write automated tests']
  } else if (t.includes('qa') || t.includes('test') || t.includes('quality')) {
    skills = ['Manual testing', 'Selenium', 'API testing', 'Postman', 'JIRA', 'Test case writing']
    responsibilities = ['Write and execute test cases', 'Perform manual/automated testing', 'Report bugs in JIRA', 'Conduct regression testing', 'Collaborate with developers']
  } else if (t.includes('sales') || t.includes('business development')) {
    skills = ['B2B Sales', 'CRM tools', 'Negotiation', 'Lead generation', 'Communication', 'MS Excel']
    responsibilities = ['Identify business opportunities', 'Build client relationships', 'Meet sales targets', 'Prepare proposals', 'Collaborate with marketing']
  } else if (t.includes('ui') || t.includes('ux') || t.includes('design')) {
    skills = ['Figma', 'Adobe XD', 'Wireframing', 'Prototyping', 'User research', 'Design systems']
    responsibilities = ['Create wireframes and prototypes', 'Conduct user research', 'Maintain design system', 'Collaborate with developers', 'Iterate based on feedback']
  }

  let experience = '3-5 years'
  if (t.includes('junior') || t.includes('fresher') || t.includes('entry')) experience = '0-2 years'
  else if (t.includes('senior') || t.includes('lead') || t.includes('principal')) experience = '5-8 years'
  else if (t.includes('manager') || t.includes('architect') || t.includes('head')) experience = '7-12 years'

  return {
    title,
    summary: `We are looking for a talented ${title} to join our growing team. The ideal candidate will bring ${experience} of hands-on experience.`,
    responsibilities,
    requirements: skills.map(s => `Proficiency in ${s}`),
    niceToHave: [
      'Experience with agile/scrum methodologies',
      'Prior experience in a product-based company',
      'Strong communication skills in English',
      'Open source or portfolio contributions'
    ],
    experience,
    jobType: 'Full-time',
    location: 'Hyderabad, India'
  }
}

export const scoreResume = async (resumeText: string, jobDescription: object): Promise<object> => {
  const text = resumeText.toLowerCase()

  const skills = text.includes('react') || text.includes('node') || text.includes('python') ||
    text.includes('typescript') || text.includes('javascript') || text.includes('java') ? 85 : 40
  const experience = text.includes('senior') || text.includes('lead') || text.includes('years') ? 80 : 50
  const education = text.includes('degree') || text.includes('bachelor') || text.includes('b.tech') ||
    text.includes('b.e') || text.includes('mca') ? 75 : 60

  const overall = Math.round((skills + experience + education) / 3)

  return {
    overallScore: overall,
    skillsScore: skills,
    experienceScore: experience,
    educationScore: education,
    explanation: `Candidate scored ${overall}/100. Skills: ${skills}/100, Experience: ${experience}/100, Education: ${education}/100.`
  }
}

export const generateInterviewQuestions = async (jobDescription: any): Promise<string[]> => {
  const title = (jobDescription?.title || '').toLowerCase()

  if (title.includes('react') || title.includes('frontend')) {
    return [
      'Explain the React component lifecycle and when you would use useEffect.',
      'How do you manage state in a large React application? Redux vs Context API?',
      'Describe a performance optimization you implemented in a React project.',
      'How do you handle API errors and loading states in React?',
      'Walk me through how you would architect a reusable component library.'
    ]
  } else if (title.includes('node') || title.includes('backend')) {
    return [
      'How do you handle authentication and authorization in a Node.js API?',
      'Explain the event loop in Node.js and how it handles async operations.',
      'How would you design a rate-limiting system for an API?',
      'Describe your approach to database query optimization.',
      'How do you ensure security in a REST API?'
    ]
  } else if (title.includes('python')) {
    return [
      'What are Python decorators and how do you use them?',
      'Explain the difference between Django and Flask.',
      'How do you handle database migrations in Django?',
      'Describe your experience with async programming in Python.',
      'How do you optimize slow database queries in Python?'
    ]
  } else if (title.includes('java')) {
    return [
      'Explain the difference between JDK, JRE, and JVM.',
      'How does Spring Boot auto-configuration work?',
      'What are the SOLID principles and how do you apply them?',
      'Describe your experience with microservices architecture.',
      'How do you handle transactions in Spring Boot?'
    ]
  } else if (title.includes('devops') || title.includes('aws') || title.includes('docker')) {
    return [
      'Describe your experience with CI/CD pipeline setup.',
      'How do you manage secrets and environment variables securely?',
      'Explain the difference between Docker and Kubernetes.',
      'How would you monitor and alert on production incidents?',
      'Describe a disaster recovery plan you have implemented.'
    ]
  } else if (title.includes('data') || title.includes('ml') || title.includes('python')) {
    return [
      'Explain the difference between supervised and unsupervised learning.',
      'How do you handle missing data in a dataset?',
      'Describe a machine learning model you built from scratch.',
      'How do you evaluate model performance and prevent overfitting?',
      'What is your experience with data pipelines and ETL processes?'
    ]
  } else {
    return [
      'Tell me about yourself and your most recent project.',
      'Describe a challenging problem you solved at work.',
      'How do you prioritize tasks when working on multiple deadlines?',
      'What is your experience working in agile teams?',
      'Where do you see yourself growing in this role?'
    ]
  }
}

export const evaluateVideoResponse = async (
  transcript: string,
  question: string
): Promise<object> => {
  const t = transcript.toLowerCase()
  const relevance = t.length > 100 ? 75 : 50
  const communication = t.length > 200 ? 80 : 60
  const behavioral = t.includes('team') || t.includes('project') || t.includes('worked') ? 78 : 55

  return {
    relevanceScore: relevance,
    communicationScore: communication,
    behavioralScore: behavioral,
    overallScore: Math.round((relevance + communication + behavioral) / 3),
    feedback: `Response shows ${relevance > 70 ? 'good' : 'average'} relevance.`
  }
}

export const generateOfferLetter = async (offerData: {
  candidateName: string
  jobTitle: string
  salary: string
  startDate: string
  companyName: string
}): Promise<string> => {
  const acceptDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')

  return `
Dear ${offerData.candidateName},

We are delighted to extend this offer of employment to you for the position of
${offerData.jobTitle} at ${offerData.companyName}.

OFFER DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Position        : ${offerData.jobTitle}
Start Date      : ${offerData.startDate}
Compensation    : ${offerData.salary} per annum
Employment Type : Full-Time

RESPONSIBILITIES:
You will be expected to contribute to our team, collaborate with
cross-functional stakeholders, and deliver high-quality work aligned with
company goals.

TERMS & CONDITIONS:
- This offer is contingent upon successful background verification.
- You will be on a probation period of 3 months from your start date.
- Standard company policies and code of conduct apply.

Please sign and return this letter by ${acceptDeadline}
to confirm your acceptance.

We look forward to welcoming you to the team!

Warm regards,
HR Team
${offerData.companyName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
}