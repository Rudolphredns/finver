# ใช้ Node.js image จาก Docker Hub
FROM node:18

# ตั้ง working directory
WORKDIR /usr/src/app

# คัดลอกไฟล์ package.json และ package-lock.json
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# คัดลอกโค้ดทั้งหมดไปยัง container
COPY . .

# เปิดพอร์ต 3000 (หรือพอร์ตที่แอปของคุณใช้)
EXPOSE 3000

# คำสั่งเริ่มต้นเมื่อรัน container
CMD ["npm", "run", "start"]