// pages/select-interests.tsx
'use client';
import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useRouter } from 'next/navigation';  // ใช้ 'next/navigation' ใน App Directory


const interestsList = [
  'Technology', 'Science', 'Music', 'Art', 'Sports', 'Travel', 'Food', 'Fashion', 'Education'
];

const SelectInterests = () => {
  const { user } = useUser();
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSelectInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests([...selectedInterests, interest]);
      } else {
        setError('กรุณาเลือกแค่ 3 ความสนใจ');
      }
    }
  };

  const handleSubmit = async () => {
    console.log('Selected Interests:', selectedInterests); // ตรวจสอบค่าที่ส่ง
    if (selectedInterests.length === 3) {
      try {
        const response = await fetch('api/updateInterests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.id,
            interests: selectedInterests,
          }),
        });
  
        const data = await response.json();
        console.log('API Response:', data); // ตรวจสอบผลลัพธ์จาก API
        if (response.ok) {
          alert('บันทึกข้อมูลเรียบร้อย');
          router.push('/');
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error('Error updating interests:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } else {
      setError('กรุณาเลือก 3 ความสนใจ');
    }
  };
  
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-4">เลือกความสนใจของคุณ</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-3 gap-4">
        {interestsList.map((interest) => (
          <button
            key={interest}
            onClick={() => handleSelectInterest(interest)}
            className={`p-4 border rounded-md ${
              selectedInterests.includes(interest) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
            }`}
          >
            {interest}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={selectedInterests.length !== 3}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
      >
        ยืนยัน
      </button>
    </div>
  );
};

export default SelectInterests;
