// src/pages/index.jsx
"use client";
import { useEffect, useState } from 'react';
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { useSocket } from '@/client/socket/context/Socketcontext';

import { FaMale, FaFemale, FaTransgender, FaGlobeAmericas } from 'react-icons/fa';

const SelectGenderAndSexInterest = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { socket } = useSocket();
  const [gender, setGender] = useState<string>('');
  const [sexInterest, setSexInterest] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen text-foreground font-medium">กำลังโหลดข้อมูลผู้ใช้...</div>;
  }

  if (!isSignedIn) {
    return <div className="flex items-center justify-center h-screen text-foreground font-medium">กรุณาเข้าสู่ระบบก่อน</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gender || !sexInterest || !user?.id) {
      setError('กรุณาเลือกเพศและความสนใจทางเพศ');
      return;
    }

    const genderToSave = gender === 'Male' ? 'male' : gender === 'Female' ? 'female' : 'any';
    const sexInterestToSave = sexInterest === 'Male' ? 'male' : sexInterest === 'Female' ? 'female' : 'any';

    try {
      const response = await fetch('/api/updateGenderAndSexInterest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gender: genderToSave,
          sexInterest: sexInterestToSave,
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

  const createOptionCard = (
    value: string,
    selectedValue: string,
    setValue: (val: string) => void,
    label: string,
    Icon: React.ComponentType<{ size?: number, color?: string }>,
    iconColor: string
  ) => (
    <div
      onClick={() => setValue(value)}
      className={`cursor-pointer rounded-lg p-4 text-center border transition-all duration-300 
        ${selectedValue === value ? 'border-primary scale-105' : 'border-border'} bg-card hover:bg-card-dark`}
    >
      <div className="flex justify-center mb-2">
        <Icon size={50} color={iconColor} />
      </div>
      <div className="font-semibold text-foreground">{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-8">
      <h1 className="text-3xl font-bold mb-10 text-center">เลือกเพศและความสนใจทางเพศ</h1>
      <form onSubmit={handleSubmit} className="space-y-8 w-full max-w-md">
        
        <div>
          <h3 className="text-xl font-semibold mb-4 text-center">เพศของคุณ</h3>
          <div className="grid grid-cols-3 gap-4">
            {createOptionCard('Male', gender, setGender, 'ชาย', FaMale, gender === 'Male' ? '#3B82F6' : '#9CA3AF')}
            {createOptionCard('Female', gender, setGender, 'หญิง', FaFemale, gender === 'Female' ? '#EC4899' : '#9CA3AF')}
            {createOptionCard(
              'Other',
              gender,
              setGender,
              'อื่น ๆ',
              FaTransgender,
              gender === 'Other' ? '#8B5CF6' : '#9CA3AF'
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4 text-center">ความสนใจทางเพศ</h3>
          <div className="grid grid-cols-3 gap-4">
            {createOptionCard('Male', sexInterest, setSexInterest, 'ชาย', FaMale, sexInterest === 'Male' ? '#3B82F6' : '#9CA3AF')}
            {createOptionCard('Female', sexInterest, setSexInterest, 'หญิง', FaFemale, sexInterest === 'Female' ? '#EC4899' : '#9CA3AF')}
            {createOptionCard(
              'Any',
              sexInterest,
              setSexInterest,
              'ไม่จำกัด',
              FaGlobeAmericas,
              sexInterest === 'Any' ? '#7C3AED' : '#9CA3AF'
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-center font-medium">{error}</p>}

        <div className="flex justify-center">
          <button
            type="submit"
            className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg hover:bg-primary-dark hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg"
          >
            ยืนยัน
          </button>
        </div>
      </form>
    </div>
  );
};

export default SelectGenderAndSexInterest;
