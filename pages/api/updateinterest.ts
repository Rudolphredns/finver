// pages/api/updateInterests.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma'; // เชื่อมต่อกับ Prisma client

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, interests } = req.body;

    if (!userId || !Array.isArray(interests) || interests.length !== 3) {
      return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง หรือเลือกความสนใจไม่ครบ 3 รายการ' });
    }

    try {
      // บันทึกข้อมูลลงในคอลัมน์ interests ของผู้ใช้
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          interests: interests.join(','),
        },
      });

      res.status(200).json({ message: 'บันทึกข้อมูลเรียบร้อย' });
    } catch (error) {
      console.error('Error updating interests:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
