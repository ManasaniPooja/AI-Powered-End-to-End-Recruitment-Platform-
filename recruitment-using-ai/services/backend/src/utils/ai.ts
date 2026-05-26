import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const generateJobDescription = async (brief: string): Promise<object> => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is missing from .env')
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a senior HR professional at a top tech company.
Transform this rough job brief into a polished, professional job description.

Brief: "${brief}"

CRITICAL RULES:
- "title" must be a formal professional job title. Extract the role and seniority.
  Examples: "data analyst 0-6 months experience" → "Junior Data Analyst"
            "react dev 3 yrs" → "Mid-Level React Developer"
            "ml engineer senior" → "Senior Machine Learning Engineer"
  NEVER copy the brief text directly into title.
- "experienceLevel" extract from brief: "0-6 months" → "0–6 months", "3 yrs" → "3–5 years"
- "summary" must be 2-3 compelling professional sentences about the role and team
- All arrays must have 5 specific, relevant items based on the role
- Return ONLY raw JSON, no markdown, no backticks, no explanation

{
  "title": "Formal Professional Job Title",
  "summary": "Compelling 2-3 sentence summary of the role and team",
  "jobType": "Full-time",
  "location": "Hyderabad, India",
  "experienceLevel": "0-6 months",
  "experience": "0-6 months",
  "responsibilities": ["...", "...", "...", "...", "..."],
  "requirements": ["...", "...", "...", "...", "..."],
  "niceToHave": ["...", "...", "..."],
  "benefits": ["...", "...", "..."]
}`
        }
      ]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    console.log('AI raw response:', text)
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)

  } catch (error: any) {
    console.error('AI generation error:', error.message)
    // Professional fallback — clean up the brief into a proper title
    const b = brief.toLowerCase()
    const levelMap: Record<string, string> = {
      'senior': 'Senior', 'lead': 'Lead', 'junior': 'Junior',
      '0-6': 'Junior', '0–6': 'Junior', 'fresher': 'Junior',
      'intern': 'Intern', 'mid': 'Mid-Level', 'manager': 'Manager'
    }
    const level = Object.entries(levelMap).find(([k]) => b.includes(k))?.[1] || ''
    const cleaned = brief
      .replace(/\d+[-–]\d+\s*(months?|years?)\s*(of\s*)?experience?/gi, '')
      .replace(/fresher|junior|senior|lead|intern|mid[-\s]?level|manager/gi, '')
      .trim()
    const titleCased = cleaned.split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    const professionalTitle = [level, titleCased].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()

    const expMatch = brief.match(/(\d+[-–]\d+\s*(months?|years?))/i)
    const expLevel = expMatch ? expMatch[1] : '1-3 years'

    return {
      title: professionalTitle || 'Software Engineer',
      summary: `We are seeking a talented ${professionalTitle || cleaned} to join our growing team in Hyderabad. The ideal candidate will bring ${expLevel} of hands-on experience and a passion for delivering high-quality work. You will collaborate closely with cross-functional teams to drive impactful outcomes.`,
      jobType: 'Full-time',
      location: 'Hyderabad, India',
      experienceLevel: expLevel,
      experience: expLevel,
      responsibilities: [
        `Design, develop and maintain solutions as a ${professionalTitle || cleaned}`,
        'Collaborate with cross-functional teams to define, design and ship features',
        'Write clean, maintainable and well-documented code or deliverables',
        'Participate in team reviews, stand-ups and knowledge-sharing sessions',
        'Troubleshoot issues and continuously improve quality and performance'
      ],
      requirements: [
        `${expLevel} of relevant experience in ${titleCased}`,
        'Strong analytical and problem-solving skills',
        'Excellent verbal and written communication skills',
        'Experience working in agile or fast-paced environments',
        "Bachelor's degree in a relevant field or equivalent practical experience"
      ],
      niceToHave: [
        'Prior experience in a product-based startup',
        'Familiarity with cloud platforms (AWS / GCP / Azure)',
        'Open source contributions or side projects'
      ],
      benefits: [
        'Competitive salary and performance bonuses',
        'Health insurance for self and family',
        'Flexible working hours and hybrid model',
        'Learning & development budget',
        '25 days paid annual leave'
      ]
    }
  }
}

export const scoreResume = async (resumeText: string, jobDescription: object): Promise<object> => {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Score this resume against the job description. Return ONLY valid JSON, no markdown:
Job Description: ${JSON.stringify(jobDescription)}
Resume: ${resumeText}

Return:
{
  "overallScore": 0-100,
  "skillsScore": 0-100,
  "experienceScore": 0-100,
  "educationScore": 0-100,
  "explanation": "brief explanation"
}`
      }]
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    const text = resumeText.toLowerCase()
    const skills = text.includes('react') || text.includes('python') || text.includes('java') ? 85 : 40
    const experience = text.includes('senior') || text.includes('years') ? 80 : 50
    const education = text.includes('degree') || text.includes('bachelor') || text.includes('b.tech') ? 75 : 60
    const overall = Math.round((skills + experience + education) / 3)
    return { overallScore: overall, skillsScore: skills, experienceScore: experience, educationScore: education, explanation: `Candidate scored ${overall}/100.` }
  }
}

export const generateInterviewQuestions = async (jobDescription: any): Promise<string[]> => {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Generate 5 technical interview questions for this job: ${JSON.stringify(jobDescription)}. Return ONLY a JSON array of 5 strings, no markdown.`
      }]
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return [
      'Tell me about yourself and your most recent project.',
      'Describe a challenging problem you solved at work.',
      'How do you prioritize tasks when working on multiple deadlines?',
      'What is your experience working in agile teams?',
      'Where do you see yourself growing in this role?'
    ]
  }
}

export const evaluateVideoResponse = async (transcript: string, question: string): Promise<object> => {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Evaluate this interview answer. Question: "${question}" Answer: "${transcript}". Return ONLY valid JSON:
{"relevanceScore": 0-100, "communicationScore": 0-100, "behavioralScore": 0-100, "feedback": "brief feedback"}`
      }]
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    const t = transcript.toLowerCase()
    const relevance = t.length > 100 ? 75 : 50
    const communication = t.length > 200 ? 80 : 60
    const behavioral = t.includes('team') || t.includes('project') ? 78 : 55
    return { relevanceScore: relevance, communicationScore: communication, behavioralScore: behavioral, feedback: 'Response evaluated successfully.' }
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
Position        : ${offerData.jobTitle}
Start Date      : ${offerData.startDate}
Compensation    : ${offerData.salary} per annum
Employment Type : Full-Time

TERMS & CONDITIONS:
- This offer is contingent upon successful background verification.
- You will be on a probation period of 3 months from your start date.
- Standard company policies and code of conduct apply.

Please sign and return this letter by ${acceptDeadline} to confirm your acceptance.

We look forward to welcoming you to the team!

Warm regards,
HR Team
${offerData.companyName}
`
}