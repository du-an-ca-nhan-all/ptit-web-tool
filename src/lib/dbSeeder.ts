import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { parse as parseYaml } from 'yaml';
import { prisma } from './prisma';

export async function ensureDatabaseSeeded(force: boolean = false): Promise<{ success: boolean; message: string; counts?: any }> {
  try {
    const meta = await prisma.systemMeta.findUnique({
      where: { key: 'initial_seeded' },
    });

    if (meta && !force) {
      const studentCount = await prisma.student.count();
      const userCount = await prisma.user.count();
      const examCount = await prisma.examRecord.count();
      return {
        success: true,
        message: 'Database already seeded',
        counts: { students: studentCount, users: userCount, examRecords: examCount },
      };
    }

    console.log('[DB Seeder] Starting streamlined database seeding...');
    const publicDir = path.join(process.cwd(), 'public');

    // 1. Read ClassConfig from class_config.yaml
    const classConfigPath = path.join(process.cwd(), 'public', 'class_config.yaml');
    const includedMap = new Map<string, string>();
    const excludedSet = new Set<string>();

    if (fs.existsSync(classConfigPath)) {
      const classConfigText = fs.readFileSync(classConfigPath, 'utf8');
      const classConfig = parseYaml(classConfigText);
      if (classConfig && Array.isArray(classConfig.classes)) {
        for (const cls of classConfig.classes) {
          if (!cls.classCode) continue;
          if (Array.isArray(cls.includedStudents)) {
            cls.includedStudents.forEach((id: string) => includedMap.set(id, cls.classCode));
          }
          if (Array.isArray(cls.excludedStudents)) {
            cls.excludedStudents.forEach((id: string) => excludedSet.add(id));
          }

          await prisma.classConfig.upsert({
            where: { classCode: cls.classCode },
            update: {
              monitorPhone: cls.monitorPhone || null,
              includedStudents: JSON.stringify(cls.includedStudents || []),
              excludedStudents: JSON.stringify(cls.excludedStudents || []),
            },
            create: {
              classCode: cls.classCode,
              monitorPhone: cls.monitorPhone || null,
              includedStudents: JSON.stringify(cls.includedStudents || []),
              excludedStudents: JSON.stringify(cls.excludedStudents || []),
            },
          });
        }
      }
    }

    // 2. Read login.yaml
    const loginYamlPath = path.join(publicDir, 'login.yaml');
    const loginUsersMap = new Map<string, any>();
    if (fs.existsSync(loginYamlPath)) {
      const loginYamlText = fs.readFileSync(loginYamlPath, 'utf8');
      const loginConfig = parseYaml(loginYamlText);
      if (loginConfig && Array.isArray(loginConfig.users)) {
        for (const u of loginConfig.users) {
          if (!u.username) continue;
          loginUsersMap.set(String(u.username).trim().toUpperCase(), u);
        }
      }
    }

    // 3. Read Course Registrations from dangky_mon_hoc
    const dkmhDir = path.join(publicDir, 'dangky_mon_hoc');
    if (fs.existsSync(dkmhDir)) {
      const folders = fs.readdirSync(dkmhDir);
      for (const folder of folders) {
        const folderPath = path.join(dkmhDir, folder);
        if (fs.statSync(folderPath).isDirectory()) {
          const mainFile = path.join(folderPath, 'main.json');
          const subFile = path.join(folderPath, 'sub-accounts.json');

          if (fs.existsSync(mainFile)) {
            const mainContent = fs.readFileSync(mainFile, 'utf8');
            await prisma.courseRegistration.deleteMany({
              where: { classCode: folder, type: 'main' },
            });
            await prisma.courseRegistration.create({
              data: {
                classCode: folder,
                type: 'main',
                data: mainContent,
              },
            });
          }

          if (fs.existsSync(subFile)) {
            const subContent = fs.readFileSync(subFile, 'utf8');
            try {
              const subList = JSON.parse(subContent);
              await prisma.courseRegistration.deleteMany({
                where: { classCode: folder, type: 'sub' },
              });
              if (Array.isArray(subList)) {
                for (const subItem of subList) {
                  await prisma.courseRegistration.create({
                    data: {
                      classCode: folder,
                      type: 'sub',
                      username: subItem.username || null,
                      data: JSON.stringify(subItem),
                    },
                  });
                }
              }
            } catch (e) {
              console.error('Failed to parse sub-accounts:', e);
            }
          }
        }
      }
    }

    // 4. Parse data.csv and extract distinct Students & ExamRecords
    const csvPath = path.join(publicDir, 'data.csv');
    let examCount = 0;
    let studentCount = 0;
    let userCount = 0;

    if (fs.existsSync(csvPath)) {
      const csvText = fs.readFileSync(csvPath, 'utf8');
      const parsed = Papa.parse<any>(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      const validData = (parsed.data || []).filter((row) => row.MaSV);

      // Student main class map
      const studentMainClassMap = new Map<string, string>();
      validData.forEach((row) => {
        if (row.MaSV && row.MaLop && !row.MaLop.includes(',')) {
          const isStandard = /^[DC]\d{2}/i.test(row.MaLop);
          if (isStandard || !studentMainClassMap.has(row.MaSV)) {
            studentMainClassMap.set(row.MaSV, row.MaLop);
          }
        }
      });

      const studentsMap = new Map<string, any>();
      const examRecordsList: any[] = [];

      validData.forEach((row) => {
        const maSV = String(row.MaSV || '').trim().toUpperCase();
        if (!maSV || excludedSet.has(maSV)) return;

        let maLop = row.MaLop;
        if (includedMap.has(maSV)) {
          maLop = includedMap.get(maSV)!;
        } else if (studentMainClassMap.has(maSV)) {
          maLop = studentMainClassMap.get(maSV)!;
        }

        if (!studentsMap.has(maSV)) {
          const loginUser = loginUsersMap.get(maSV);
          const hoLot = row.HoLotSV ? String(row.HoLotSV).trim() : '';
          const ten = row.TenSV ? String(row.TenSV).trim() : '';
          const hoTen = `${hoLot} ${ten}`.trim();

          studentsMap.set(maSV, {
            maSV,
            hoLot: hoLot || null,
            ten: ten || null,
            hoTen: hoTen || loginUser?.fullName || null,
            gioiTinh: row.PHAI ? String(row.PHAI).trim() : 'Nam',
            ngaySinh: row.NgaySinhC ? String(row.NgaySinhC).trim() : null,
            maLop: loginUser?.lop || maLop || null,
            soDienThoai: loginUser?.phoneNumber || null,
            ghiChu: null,
          });
        }

        examRecordsList.push({
          maSV,
          nhomThi: row.NhomThi ? String(row.NhomThi).trim() : null,
          mapThi: row.MAPTHI ? String(row.MAPTHI).trim() : null,
          maMH: row.MaMH ? String(row.MaMH).trim() : null,
          tenMH: row.TenMH ? String(row.TenMH).trim() : null,
          maHTThi: row.MaHTThi ? String(row.MaHTThi).trim() : null,
          nhomHoc: row.NhomHoc ? String(row.NhomHoc).trim() : null,
          toThi: row['To thi'] ? String(row['To thi']).trim() : (row.ToThi ? String(row.ToThi).trim() : null),
          maLopMH: row.MaLop ? String(row.MaLop).trim() : null,
          ngayThi: row.NgayThi ? String(row.NgayThi).trim() : null,
          gioThi: row.GioThi ? String(row.GioThi).trim() : null,
          soPhutThi: row.SoPhutThi ? String(row.SoPhutThi).trim() : null,
          maDotThi: row.MaDotThi ? String(row.MaDotThi).trim() : null,
          tenDotThi: row.TenDotThi ? String(row.TenDotThi).trim() : null,
        });
      });

      // Add monitors from login.yaml not in CSV
      loginUsersMap.forEach((u, username) => {
        if (!studentsMap.has(username)) {
          studentsMap.set(username, {
            maSV: username,
            hoLot: '',
            ten: u.fullName || username,
            hoTen: u.fullName || username,
            gioiTinh: 'Nam',
            ngaySinh: null,
            maLop: u.lop || null,
            soDienThoai: u.phoneNumber || null,
            ghiChu: null,
          });
        }
      });

      // Clear existing records if force
      if (force) {
        await prisma.examRecord.deleteMany();
        await prisma.user.deleteMany();
        await prisma.student.deleteMany();
      }

      // 4a. Batch insert Students
      const studentArray = Array.from(studentsMap.values());
      const studentChunkSize = 500;
      for (let i = 0; i < studentArray.length; i += studentChunkSize) {
        const chunk = studentArray.slice(i, i + studentChunkSize);
        await prisma.student.createMany({
          data: chunk,
        });
        studentCount += chunk.length;
      }

      // 4b. Batch insert Users (username = maSV, support multiple roles like 'admin,lop_truong')
      const userList = studentArray.map((s) => {
        const loginUser = loginUsersMap.get(s.maSV);
        const role = Array.isArray(loginUser?.role)
          ? loginUser.role.join(',')
          : String(loginUser?.role || 'sinh_vien');

        return {
          username: s.maSV,
          passwordHash: loginUser?.password_hash || '',
          role,
          isActive: true,
        };
      });

      for (let i = 0; i < userList.length; i += studentChunkSize) {
        const chunk = userList.slice(i, i + studentChunkSize);
        await prisma.user.createMany({
          data: chunk,
        });
        userCount += chunk.length;
      }

      // 4c. Batch insert ExamRecords
      const examChunkSize = 500;
      for (let i = 0; i < examRecordsList.length; i += examChunkSize) {
        const chunk = examRecordsList.slice(i, i + examChunkSize);
        await prisma.examRecord.createMany({
          data: chunk,
        });
        examCount += chunk.length;
      }
    }

    // Set initial_seeded in SystemMeta
    await prisma.systemMeta.upsert({
      where: { key: 'initial_seeded' },
      update: { value: new Date().toISOString() },
      create: { key: 'initial_seeded', value: new Date().toISOString() },
    });

    console.log(`[DB Seeder] Done! Seeded ${studentCount} students, ${userCount} users, ${examCount} exam records.`);
    return {
      success: true,
      message: 'Database seeded successfully',
      counts: { students: studentCount, users: userCount, examRecords: examCount },
    };
  } catch (error: any) {
    console.error('[DB Seeder] Error seeding database:', error);
    return {
      success: false,
      message: error.message || 'Unknown seeding error',
    };
  }
}
