const fs = require('fs');
let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

// Update sessionMap
code = code.replace(
`      subjectCode: string;
      counts: Map<string, number>;
    }>();`,
`      subjectCode: string;
      examFormat: string;
      counts: Map<string, number>;
    }>();`
);

// Update sessionMap.set
code = code.replace(
`            subject: r.TenMH,
            subjectCode: r.MaMH,
            counts: new Map<string, number>()
          });`,
`            subject: r.TenMH,
            subjectCode: r.MaMH,
            examFormat: r.MaHTThi || '',
            counts: new Map<string, number>()
          });`
);

// Update allSessions map
code = code.replace(
`        subjectCode: session.subjectCode,
        classCounts,
        isResponsible
      };
    });`,
`        subjectCode: session.subjectCode,
        examFormat: session.examFormat,
        classCounts,
        isResponsible
      };
    });`
);

// Add import for pricing
code = code.replace(
`import { Mail, ChevronRight, Users, MapPin, ExternalLink, Calculator } from 'lucide-react';`,
`import { Mail, ChevronRight, Users, MapPin, ExternalLink, Calculator, DollarSign } from 'lucide-react';
import { calculateRoomPrice, formatCurrency } from '../config/pricingConfig';`
);

fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', code);
