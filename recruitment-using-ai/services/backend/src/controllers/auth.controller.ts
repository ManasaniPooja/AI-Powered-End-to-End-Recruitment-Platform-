import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma'
import { generateToken } from '../utils/jwt'
import crypto from 'crypto'
import { sendResetEmail } from '../utils/mailer'

const VALID_ROLES = ['HIRING_MANAGER', 'RECRUITER', 'ADMIN']

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    // Role validation — default to HIRING_MANAGER if invalid
    const userRole = VALID_ROLES.includes(role) ? role : 'HIRING_MANAGER'

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered. Please login.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: userRole }
    })

    const token = generateToken({ id: user.id, email: user.email, role: user.role })

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error: any) {
    // Prisma unique constraint error
    if (error?.code === 'P2002') {
      return res.status(400).json({ message: 'Email already registered. Please login.' })
    }
    // Prisma invalid enum error
    if (error?.code === 'P2006' || error?.message?.includes('invalid value')) {
      return res.status(400).json({ message: 'Invalid role selected' })
    }
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role })

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })
    return res.status(200).json(user)
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: String(error) })
  }
}
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' })

    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    })

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
    await sendResetEmail(email, resetLink)

    return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (error: any) {
    console.error('forgotPassword error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' })
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    })
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' })

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    })

    return res.status(200).json({ message: 'Password reset successfully. You can now log in.' })
  } catch (error: any) {
    console.error('resetPassword error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}