const fs = require('fs');

let content = fs.readFileSync('src/components/CourseCompare.tsx', 'utf-8');

content = content.replace(
  '<h3 className="font-bold text-rose-800">Môn học bị thiếu (Cần bổ sung)</h3>',
  '<h3 className="font-bold text-rose-800 flex items-center gap-2">Môn học bị thiếu (Cần bổ sung) <span className="text-xs font-normal text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">Ấn vào để xem chi tiết</span></h3>'
);

content = content.replace(
  '<h3 className="font-bold text-amber-800">Khác nhóm tổ với Lớp trưởng</h3>',
  '<h3 className="font-bold text-amber-800 flex items-center gap-2">Khác nhóm tổ với Lớp trưởng <span className="text-xs font-normal text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Ấn vào để xem chi tiết</span></h3>'
);

fs.writeFileSync('src/components/CourseCompare.tsx', content);
