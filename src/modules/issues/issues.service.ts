import { pool } from '../../db/dbConfig.js';

export const createIssue = async (body: any, reporterId: number) => {
  const { title, description, type } = body;

  const sql = `
    INSERT INTO issues (title, description, type, reporter_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await pool.query(sql, [title, description, type, reporterId]);
  return result.rows[0];
};

export const getAllIssues = async (filters: any) => {
  const params: any[] = [];
  const conditions: string[] = [];

  if (filters.type) {
    params.push(filters.type);
    conditions.push(`i.type = $${params.length}`);
  }

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`i.status = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortOrder = filters.sort === 'oldest' ? 'ASC' : 'DESC';

  const sql = `
    SELECT 
      i.id, i.title, i.description, i.type, i.status, i.created_at, i.updated_at,
      u.id AS reporter_id, u.name AS reporter_name
    FROM issues i
    JOIN users u ON i.reporter_id = u.id
    ${whereClause}
    ORDER BY i.created_at ${sortOrder}
  `;

  const result = await pool.query(sql, params);

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    reporter: {
      id: row.reporter_id,
      name: row.reporter_name,
    },
  }));
};

export const getIssueById = async (id: number) => {
  const sql = `
    SELECT 
      i.id, i.title, i.description, i.type, i.status, i.created_at, i.updated_at,
      u.id AS reporter_id, u.name AS reporter_name, u.role AS reporter_role
    FROM issues i
    JOIN users u ON i.reporter_id = u.id
    WHERE i.id = $1
  `;
  const result = await pool.query(sql, [id]);
  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    reporter: {
      id: row.reporter_id,
      name: row.reporter_name,
      role: row.reporter_role,
    },
  };
};

export const updateIssue = async (id: number, body: any) => {
  const { title, description, type, status } = body;

  const fields = [];
  const params = [];
  let count = 1;

  if (title) { fields.push(`title = $${count++}`); params.push(title); }
  if (description) { fields.push(`description = $${count++}`); params.push(description); }
  if (type) { fields.push(`type = $${count++}`); params.push(type); }
  if (status) { fields.push(`status = $${count++}`); params.push(status); }

  if (fields.length === 0) return null;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  params.push(id);
  const sql = `UPDATE issues SET ${fields.join(', ')} WHERE id = $${count} RETURNING *`;
  const result = await pool.query(sql, params);
  return result.rows[0];
};

export const deleteIssue = async (id: number) => {
  const result = await pool.query('DELETE FROM issues WHERE id = $1 RETURNING id', [id]);
  return !!result.rowCount;
};