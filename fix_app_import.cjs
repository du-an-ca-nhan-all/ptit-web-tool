const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { CalendarDays, LogOut, LayoutDashboard, Calendar, Users, FileText, Search, Download, Wrench, ChevronDown, ChevronRight, GraduationCap, Mail, Settings, User, BookOpen, Menu, X } from 'lucide-react';",
  "import { CalendarDays, LogOut, LayoutDashboard, Calendar, Users, FileText, Search, Download, Wrench, ChevronDown, ChevronRight, GraduationCap, Mail, Settings, User, BookOpen, Menu, X, DollarSign } from 'lucide-react';"
);

fs.writeFileSync('src/App.tsx', code);
