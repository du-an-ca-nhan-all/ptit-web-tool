const fs = require('fs');
let code = fs.readFileSync('src/components/RoomEnvelopeManager.tsx', 'utf8');

code = code.replace(
  "import { Mail, MapPin, Users, Info, Calculator, X } from 'lucide-react';",
  "import { Mail, MapPin, Users, Info, Calculator, X, DollarSign } from 'lucide-react';\nimport { calculateRoomPrice, formatCurrency } from '../config/pricingConfig';"
);

fs.writeFileSync('src/components/RoomEnvelopeManager.tsx', code);
