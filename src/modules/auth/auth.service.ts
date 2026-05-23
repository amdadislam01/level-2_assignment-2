import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../db/dbConfig.js';
import { env } from '../../config/envConfig.js';

export const registerUser = async (body: any) => {
  const { name, email, password, role } = body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = `
    INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at, updated_at
  `;

  const result = await pool.query(sql, [name, email, hashedPassword, role || 'contributor']);
  return result.rows[0];
};

export const loginUser = async (body: any) => {
  const { email, password } = body;

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return null;
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as any }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};