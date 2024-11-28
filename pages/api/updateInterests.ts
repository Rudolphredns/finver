// pages/api/updateInterests.ts

import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'finver', 
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database');
});

const updateUserInterests = async (userId: string, interests: string[]) => {
  return new Promise((resolve, reject) => {
    // แปลง array เป็น string คั่นด้วยจุลภาค
    const interestsString = interests.join(',');  // เปลี่ยนจาก array เป็น string

    const query = `
      UPDATE users
      SET interests = ?
      WHERE clerk_user_id = ?
    `;
    db.query(query, [interestsString, userId], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, interests } = req.body;

    // ตรวจสอบข้อมูล
    if (!userId || !Array.isArray(interests) || interests.length !== 3) {
      return res.status(400).json({ message: 'กรุณาเลือก 3 ความสนใจ' });
    }

    try {
      await updateUserInterests(userId, interests);  // เรียกฟังก์ชันที่อัพเดตข้อมูล
      return res.status(200).json({ message: 'อัพเดทข้อมูลความสนใจสำเร็จ' });
    } catch (error) {
      console.error('Error updating interests:', error);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
