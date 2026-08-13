const fs = require('fs');

const appFile = fs.readFileSync('src/App.tsx', 'utf8');
const searchStr = `          let cleanedData = results.data.filter(row => row.MaSV);`;
const replaceStr = `          let validData = results.data.filter(row => row.MaSV);
          
          // Tự động tìm lớp chính của sinh viên (ưu tiên các mã lớp có dạng D... hoặc C... và không có dấu phẩy)
          const studentMainClassMap = new Map<string, string>();
          validData.forEach(row => {
            if (row.MaSV && row.MaLop && !row.MaLop.includes(',')) {
               // Nếu lớp có dạng chuẩn D25... thì ưu tiên
               const isStandard = /^[DC]\\d{2}/i.test(row.MaLop);
               if (isStandard || !studentMainClassMap.has(row.MaSV)) {
                  studentMainClassMap.set(row.MaSV, row.MaLop);
               }
            }
          });

          let cleanedData = validData
            .filter(row => !excludedSet.has(row.MaSV))
            .map(row => {
              if (includedMap.has(row.MaSV)) {
                return { ...row, MaLop: includedMap.get(row.MaSV)! };
              }
              // Ghi đè mã lớp môn học bằng mã lớp chính của sinh viên nếu có
              if (studentMainClassMap.has(row.MaSV)) {
                return { ...row, MaLop: studentMainClassMap.get(row.MaSV)! };
              }
              return row;
            });`;

const newAppFile = appFile.replace(searchStr, replaceStr);
fs.writeFileSync('src/App.tsx', newAppFile);
