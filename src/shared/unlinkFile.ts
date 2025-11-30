import fs from 'fs';
import path from 'path';

// const unlinkFile = (file: string) => {
//   const filePath = path.join('uploads', file);
//   if (fs.existsSync(filePath)) {
//     fs.unlinkSync(filePath);
//   }
// };


const unlinkFile = (filePathFromDB: string) => {
  if (!filePathFromDB) return;

  const fileName = filePathFromDB.replace("/image/", "");

  // এবার uploads ফোল্ডারে ফাইলটা কোথায় আছে তার path বানানো হচ্ছে
  const fullPath = path.join("uploads", fileName);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};


export default unlinkFile;