// pages/select-interests.tsx
'use client';
import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useRouter } from 'next/navigation';
import { FaLaptop, FaMusic, FaPalette, FaDumbbell, FaGlobe, FaUtensils, FaTshirt, FaBook, FaPlane } from 'react-icons/fa';

const interestsList = [
  { name: 'Technology', icon: FaLaptop },
  { name: 'Science', icon: FaGlobe },
  { name: 'Music', icon: FaMusic },
  { name: 'Art', icon: FaPalette },
  { name: 'Sports', icon: FaDumbbell },
  { name: 'Travel', icon: FaPlane },
  { name: 'Food', icon: FaUtensils },
  { name: 'Fashion', icon: FaTshirt },
  { name: 'Education', icon: FaBook },
];

const SelectInterests = () => {
  const { user } = useUser();
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSelectInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
      setError(null); // ลบข้อความผิดพลาดเมื่อแก้ไข
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests([...selectedInterests, interest]);
      } else {
        setError('กรุณาเลือกแค่ 3 ความสนใจ');
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedInterests.length === 3) {
      try {
        const response = await fetch('/api/updateInterests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            interests: selectedInterests,
          }),
        });

        const data = await response.json();
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4">
      <h1 className="text-3xl font-bold mb-8">เลือกความสนใจของคุณ</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg">
        {interestsList.map((interest) => {
          const Icon = interest.icon;
          return (
            <div
              key={interest.name}
              onClick={() => handleSelectInterest(interest.name)}
              className={`cursor-pointer p-6 flex flex-col items-center justify-center border rounded-lg transition-all duration-300 
              ${selectedInterests.includes(interest.name) ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-card-dark'}`}
            >
              <Icon size={30} className="mb-2" />
              <span className="text-center font-semibold">{interest.name}</span>
            </div>
          );
        })}
      </div>
      <button
        onClick={handleSubmit}
        disabled={selectedInterests.length !== 3}
        className="mt-6 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg shadow-md disabled:bg-muted disabled:text-muted-foreground transition-all"
      >
        ยืนยัน
      </button>
    </div>
  );
};

export default SelectInterests;
