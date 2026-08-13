const fs = require('fs');
let code = fs.readFileSync('src/components/SettlementManager.tsx', 'utf8');

// Update imports and props
code = code.replace(
  "import { ExamRecord, LoginUser } from '../types';",
  "import { ExamRecord, LoginUser, ExamSession } from '../types';"
);

code = code.replace(
  "interface SettlementManagerProps {\n  records: ExamRecord[];\n  loginUsers?: LoginUser[];\n}",
  "interface SettlementManagerProps {\n  records: ExamRecord[];\n  sessions: ExamSession[];\n  loginUsers?: LoginUser[];\n}"
);

code = code.replace(
  "export default function SettlementManager({ records, loginUsers = [] }: SettlementManagerProps) {",
  "export default function SettlementManager({ records, sessions = [], loginUsers = [] }: SettlementManagerProps) {"
);

// Replace the calculation logic inside useMemo
const calcLogicStart = "  const data = useMemo(() => {";
const calcLogicEnd = "  }, [records, selectedClass, monitorClasses, loginUsers]);";

const newCalcLogic = `  const data = useMemo(() => {
    if (!selectedClass || sessions.length === 0) {
      return { receivables: [], payables: [], settled: [], totalReceive: 0, totalPay: 0, netTotal: 0 };
    }

    const allDebts: DebtDetail[] = [];

    sessions.forEach(session => {
      // Find classes with monitors in this session
      const monitoredClassesInRoom = session.classCounts.filter(c => monitorClasses.has(c.className));
      if (monitoredClassesInRoom.length <= 1) return; // Only 1 monitor or none, no cross-settlement needed

      // The monitor with the most students is responsible for the envelope
      const responsibleClass = monitoredClassesInRoom[0].className;
      const totalMonitoredStudents = monitoredClassesInRoom.reduce((acc, c) => acc + c.count, 0);
      const roomPrice = calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat);
      const pricePerStudent = roomPrice / totalMonitoredStudents;

      monitoredClassesInRoom.forEach(c => {
        if (c.className !== responsibleClass) {
          allDebts.push({
            session,
            fromClass: c.className, // Class C owes
            toClass: responsibleClass, // Class A (the one who receives the envelope)
            amount: c.count * pricePerStudent,
            studentsCount: c.count,
            pricePerStudent,
            totalRoomPrice: roomPrice
          });
        }
      });
    });

    const pMap = new Map<string, PartnerBalance>();
    monitorClasses.forEach(c => {
      if (c !== selectedClass) {
        pMap.set(c, {
          partnerClass: c,
          partnerMonitor: getMonitorName(c),
          netBalance: 0,
          detailsOweUs: [],
          detailsWeOwe: []
        });
      }
    });

    allDebts.forEach(debt => {
      if (debt.fromClass === selectedClass) {
        // We owe them
        const p = pMap.get(debt.toClass);
        if (p) {
          p.netBalance -= debt.amount;
          p.detailsWeOwe.push(debt);
        }
      } else if (debt.toClass === selectedClass) {
        // They owe us
        const p = pMap.get(debt.fromClass);
        if (p) {
          p.netBalance += debt.amount;
          p.detailsOweUs.push(debt);
        }
      }
    });

    const activePartners = Array.from(pMap.values()).filter(p => Math.abs(p.netBalance) > 0.01 || p.detailsOweUs.length > 0 || p.detailsWeOwe.length > 0);

    let totalReceive = 0;
    let totalPay = 0;

    activePartners.forEach(p => {
      if (p.netBalance > 0.01) totalReceive += p.netBalance;
      if (p.netBalance < -0.01) totalPay += Math.abs(p.netBalance);
    });

    const receivables = activePartners.filter(p => p.netBalance > 0.01).sort((a, b) => b.netBalance - a.netBalance);
    const payables = activePartners.filter(p => p.netBalance < -0.01).sort((a, b) => a.netBalance - b.netBalance);
    const settled = activePartners.filter(p => Math.abs(p.netBalance) <= 0.01);

    return { receivables, payables, settled, totalReceive, totalPay, netTotal: totalReceive - totalPay };

  }, [sessions, selectedClass, monitorClasses, loginUsers]);`;

const oldLogicRegex = /  const data = useMemo\(\(\) => \{[\s\S]*?  \}, \[records, selectedClass, monitorClasses, loginUsers\]\);/g;
code = code.replace(oldLogicRegex, newCalcLogic);

fs.writeFileSync('src/components/SettlementManager.tsx', code);
