// pages/api/updateGenderAndSexInterest.ts

import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // ใส่ password หากมี
  database: 'finver', // ชื่อฐานข้อมูล
};

const updateUserGenderAndSexInterest = async (userId: string, gender: string, sexInterest: string) => {
  const connection = await mysql.createConnection(dbConfig);

  try {
    const query = `
      UPDATE users
      SET gender = ?, sex_interest = ?
      WHERE clerk_user_id = ?
    `;
    const [results] = await connection.execute(query, [gender, sexInterest, userId]);

    return results;
  } catch (error: unknown) {  // ตั้งค่า error เป็น unknown
    if (error instanceof Error) {  // เช็คว่า error เป็น instance ของ Error หรือไม่
      throw new Error('Error updating gender and sex_interest: ' + error.message);
    } else {
      // ถ้าไม่ใช่ error แบบที่คาดหวัง ก็จะโยน error ใหม่ที่เป็นข้อความ
      throw new Error('An unknown error occurred while updating gender and sex_interest');
    }
  } finally {
    await connection.end();
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, gender, sexInterest } = req.body;

    if (!userId || !gender || !sexInterest) {
      return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }

    try {
      const results = await updateUserGenderAndSexInterest(userId, gender, sexInterest);
      return res.status(200).json({ message: 'อัพเดทข้อมูล gender และ sex_interest สำเร็จ', results });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error updating gender and sex_interest:', error.message);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล: ' + error.message });
      } else {
        console.error('Unknown error occurred:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล' });
      }
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
