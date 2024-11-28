'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useRouter } from 'next/navigation';

const SelectGenderAndSexInterest = () => {
  const { user, isLoaded, isSignedIn } = useUser();  // ใช้ isLoaded และ isSignedIn ตรวจสอบสถานะของผู้ใช้
  const [gender, setGender] = useState<string>(''); // เก็บค่าของ Gender
  const [sexInterest, setSexInterest] = useState<string>(''); // เก็บค่าของ Sex Interest
  const [error, setError] = useState<string | null>(null); // เก็บข้อความผิดพลาด
  const router = useRouter();

  // ตรวจสอบสถานะของผู้ใช้
  if (!isLoaded) {
    return <div>กำลังโหลดข้อมูลผู้ใช้...</div>;  // รอโหลดข้อมูลผู้ใช้
  }

  if (!isSignedIn) {
    return <div>กรุณาเข้าสู่ระบบก่อน</div>;  // ถ้ายังไม่ได้เข้าสู่ระบบ
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gender || !sexInterest || !user?.id) {
      setError('กรุณาเลือกเพศและความสนใจทางเพศ');
      return;
    }

    // แปลงค่า gender ตามที่ต้องการ
    let genderToSave = '';
    if (gender === 'Male') {
      genderToSave = 'male';
    } else if (gender === 'Female') {
      genderToSave = 'female';
    } else if (gender === 'Other') {
      genderToSave = 'any';
    }

    // แปลงค่า sexInterest ตามที่ต้องการ
    let sexInterestToSave = '';
    if (sexInterest === 'Male') {
      sexInterestToSave = 'male';
    } else if (sexInterest === 'Female') {
      sexInterestToSave = 'female';
    } else if (sexInterest === 'Any') {
      sexInterestToSave = 'any';
    }

    try {
      const response = await fetch('/api/updateGenderAndSexInterest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          gender: genderToSave,
          sexInterest: sexInterestToSave,  // ส่งค่า sexInterest
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('อัพเดทข้อมูลสำเร็จ');
        router.push('/select_interest'); 
      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล');
      }
    } catch (error) {
      console.error('Error updating gender and sex interest:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <div>
      <h1>เลือกเพศและความสนใจทางเพศ</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <h3>เลือกเพศ</h3>
          <label>
            <input
              type="radio"
              value="Male"
              checked={gender === 'Male'}
              onChange={() => setGender('Male')}
            />
            ชาย
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              value="Female"
              checked={gender === 'Female'}
              onChange={() => setGender('Female')}
            />
            หญิง
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              value="Other"
              checked={gender === 'Other'}
              onChange={() => setGender('Other')}
            />
            อื่น ๆ
          </label>
        </div>

        <div>
          <h3>เลือกความสนใจทางเพศ</h3>
          <label>
            <input
              type="radio"
              value="Male"
              checked={sexInterest === 'Male'}
              onChange={() => setSexInterest('Male')}
            />
            Male
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              value="Female"
              checked={sexInterest === 'Female'}
              onChange={() => setSexInterest('Female')}
            />
            Female
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              value="Any"
              checked={sexInterest === 'Any'}
              onChange={() => setSexInterest('Any')}
            />
            Any
          </label>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit">ยืนยัน</button>
      </form>
    </div>
  );
};

export default SelectGenderAndSexInterest;
