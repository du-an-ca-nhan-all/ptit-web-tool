const fs = require('fs');
let code = fs.readFileSync('src/components/AllMonitorsEnvelopes.tsx', 'utf8');

// Add import
code = code.replace(
`import { Mail, Search, MapPin, Users } from 'lucide-react';`,
`import { Mail, Search, MapPin, Users, DollarSign } from 'lucide-react';
import { calculateRoomPrice, formatCurrency } from '../config/pricingConfig';`
);

// Add examFormat
code = code.replace(
`      subjectCode: string;
      counts: Map<string, number>;
    }>();`,
`      subjectCode: string;
      examFormat: string;
      counts: Map<string, number>;
    }>();`
);

code = code.replace(
`          subject: r.TenMH,
          subjectCode: r.MaMH,
          counts: new Map<string, number>()
        });`,
`          subject: r.TenMH,
          subjectCode: r.MaMH,
          examFormat: r.MaHTThi || '',
          counts: new Map<string, number>()
        });`
);

code = code.replace(
`        subjectCode: session.subjectCode,
        classCounts,
        responsibleClasses
      };`,
`        subjectCode: session.subjectCode,
        examFormat: session.examFormat,
        classCounts,
        responsibleClasses
      };`
);

fs.writeFileSync('src/components/AllMonitorsEnvelopes.tsx', code);
