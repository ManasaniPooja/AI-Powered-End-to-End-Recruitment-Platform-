import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'recruitment_secret_key'

export const generateToken = (payload: {
  id: string
  email: string
  role: string
}) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as {
    id: string
    email: string
    role: string
  }
}