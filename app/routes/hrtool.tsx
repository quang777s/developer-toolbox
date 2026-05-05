import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import type { Route } from "./+types/hrtool";

export function meta({}: Route.MetaArgs) {
  return [{ title: "HRTool" }];
}

export default function HRTool() {
  const [token, setToken] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Months are 0-indexed
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isOpen, setIsOpen] = useState(false);
  const [wfhDays, setWfhDays] = useState<string[]>([]);
  const [selectedWfhDays, setSelectedWfhDays] = useState<Set<string>>(new Set());
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [sprintOtDays, setSprintOtDays] = useState<string[]>([]);
  const [selectedSprintOtDays, setSelectedSprintOtDays] = useState<Set<string>>(new Set());
  const [selectedHour, setSelectedHour] = useState(21);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedEndHour, setSelectedEndHour] = useState(23);
  const [selectedEndMinute, setSelectedEndMinute] = useState(0);
  const [weeklyDialogOpen, setWeeklyDialogOpen] = useState(false);
  const [weeklyOtDays, setWeeklyOtDays] = useState<string[]>([]);
  const [selectedWeeklyOtDays, setSelectedWeeklyOtDays] = useState<Set<string>>(new Set());
  const [weeklySelectedHour, setWeeklySelectedHour] = useState(21);
  const [weeklySelectedMinute, setWeeklySelectedMinute] = useState(0);
  const [weeklySelectedEndHour, setWeeklySelectedEndHour] = useState(23);
  const [weeklySelectedEndMinute, setWeeklySelectedEndMinute] = useState(0);
  const [customWfhDate, setCustomWfhDate] = useState('');
  const [customSprintOtDate, setCustomSprintOtDate] = useState('');
  const [customWeeklyOtDate, setCustomWeeklyOtDate] = useState('');

  // Load token from localStorage on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('hrtool_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Save token to localStorage whenever it changes
  const handleTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = event.target.value;
    setToken(newToken);
    localStorage.setItem('hrtool_token', newToken);
  };

  // Generate month options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate year options (current year and next 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  // Generate WFH days for Wednesday, Thursday, Friday in the selected month
  const generateWfhDays = (month: number, year: number): string[] => {
    const wfhDays: string[] = [];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Get the first day of the month
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    // Find all Wednesdays (3), Thursdays (4), and Fridays (5) in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek === 3 || dayOfWeek === 4 || dayOfWeek === 5) {
        wfhDays.push(`${months[month - 1]} ${day}, ${year} (${daysOfWeek[dayOfWeek]})`);
      }
    }

    return wfhDays;
  };

  // Generate Monday days for Sprint planning OT in the selected month
  const generateSprintOtDays = (month: number, year: number): string[] => {
    const mondayDays: string[] = [];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const daysInMonth = new Date(year, month, 0).getDate();

    // Find all Mondays (1) in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek === 1) {
        mondayDays.push(`${months[month - 1]} ${day}, ${year} (${daysOfWeek[dayOfWeek]})`);
      }
    }

    return mondayDays;
  };

  // Generate Wednesday days for Weekly discussion OT in the selected month
  const generateWeeklyOtDays = (month: number, year: number): string[] => {
    const wednesdayDays: string[] = [];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const daysInMonth = new Date(year, month, 0).getDate();

    // Find all Wednesdays (3) in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek === 3) {
        wednesdayDays.push(`${months[month - 1]} ${day}, ${year} (${daysOfWeek[dayOfWeek]})`);
      }
    }

    return wednesdayDays;
  };

  // Handle Register WFH button click
  const handleRegisterWfh = () => {
    const days = generateWfhDays(selectedMonth, selectedYear);
    setWfhDays(days);
    setSelectedWfhDays(new Set(days)); // Select all by default
    setIsOpen(true);
  };

  // Toggle WFH day selection
  const toggleWfhDay = (day: string) => {
    const newSelected = new Set(selectedWfhDays);
    if (newSelected.has(day)) {
      newSelected.delete(day);
    } else {
      newSelected.add(day);
    }
    setSelectedWfhDays(newSelected);
  };

  // Check all WFH days
  const checkAllWfhDays = () => {
    setSelectedWfhDays(new Set(wfhDays));
  };

  // Uncheck all WFH days
  const uncheckAllWfhDays = () => {
    setSelectedWfhDays(new Set());
  };

  // Add custom WFH day
  const addCustomWfhDay = () => {
    if (customWfhDate.trim()) {
      const newDays = [...wfhDays, customWfhDate.trim()];
      setWfhDays(newDays);
      setSelectedWfhDays(new Set([...selectedWfhDays, customWfhDate.trim()]));
      setCustomWfhDate('');
    }
  };

  // Handle confirm action
  const handleConfirmWfh = async () => {
    const daysToProcess = Array.from(selectedWfhDays);
    console.log('WFH registration confirmed for:', daysToProcess);
    setIsOpen(false);

    if (!token) {
      alert('Please enter your token first');
      return;
    }

    if (daysToProcess.length === 0) {
      alert('Please select at least one day');
      return;
    }

    const results: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Make API requests for each WFH day
    for (const day of daysToProcess) {
      try {
        // Parse the date: "November 28, 2025 (Thursday)" -> "2025-11-28T00:00:00.000Z"
        const dateMatch = day.match(/(\w+)\s+(\d+),\s+(\d+)/);
        if (!dateMatch) continue;

        const [, monthName, dayNum, year] = dateMatch;
        const monthIndex = months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
        if (monthIndex === -1) continue;

        const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}T00:00:00.000Z`;

        // Prepare the request data
        const requestData = {
          From: dateStr,
          To: dateStr,
          Type: "day",
          NhomPhuCap: null,
          IsTomorrowFromTime: false,
          IsTomorrowToTime: false,
          FromTime: "08:00:00",
          ToTime: "08:00:00",
          CTPhi: "",
          Distance: 0,
          PhuongTienDiChuyen: "",
          LoaiCongTac: 6,
          GhiChu: "",
          LyDo: "WFH theo lịch",
          TenCty: "",
          DiaChiCT: "",
          NguoiLienHe: "",
          ThongTinLienLac: "",
          NotifyEmail: [],
          UserRequest: ["60063"]
        };

        // Make the API request
        const response = await fetch('https://hrtool.larion.com:3106/api/HR_Mission/RegisterMission', {
          method: 'POST',
          headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
            'authorization': `bearer ${token}`,
            'cache-control': 'no-cache',
            'content-type': 'application/json;charset=UTF-8',
            'language': 'vi',
            'origin': 'https://hrtool.larion.com',
            'priority': 'u=1, i',
            'referer': 'https://hrtool.larion.com/',
            'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0'
          },
          body: JSON.stringify(requestData)
        });

        const responseData = await response.json();

        if (response.ok) {
          successCount++;
          results.push(`✅ ${day}: SUCCESS - ${JSON.stringify(responseData)}`);
        } else {
          errorCount++;
          results.push(`❌ ${day}: FAILED - ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
        }
      } catch (error) {
        errorCount++;
        results.push(`❌ ${day}: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Save results to file
    const fileContent = `# WFH Registration Results\n# Generated on ${new Date().toISOString()}\n# For ${months[selectedMonth - 1]} ${selectedYear}\n\nSummary:\n- Successful: ${successCount}\n- Failed: ${errorCount}\n- Total: ${daysToProcess.length}\n\nDetailed Results:\n\n${results.join('\n')}`;

    try {
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wfh_registration_results_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`WFH registration completed!\nSuccessful: ${successCount}\nFailed: ${errorCount}\nResults saved to file.`);
    } catch (error) {
      console.error('Error saving file:', error);
      alert(`WFH registration completed!\nSuccessful: ${successCount}\nFailed: ${errorCount}\nError saving results file.`);
    }
  };

  // Handle cancel action
  const handleCancelWfh = () => {
    setIsOpen(false);
    setWfhDays([]);
    setSelectedWfhDays(new Set());
  };

  // Handle Sprint planning OT button click
  const handleSprintPlanningOt = () => {
    const days = generateSprintOtDays(selectedMonth, selectedYear);
    setSprintOtDays(days);
    setSelectedSprintOtDays(new Set(days)); // Select all by default
    setSprintDialogOpen(true);
  };

  // Toggle Sprint OT day selection
  const toggleSprintOtDay = (day: string) => {
    const newSelected = new Set(selectedSprintOtDays);
    if (newSelected.has(day)) {
      newSelected.delete(day);
    } else {
      newSelected.add(day);
    }
    setSelectedSprintOtDays(newSelected);
  };

  // Check all Sprint OT days
  const checkAllSprintOtDays = () => {
    setSelectedSprintOtDays(new Set(sprintOtDays));
  };

  // Uncheck all Sprint OT days
  const uncheckAllSprintOtDays = () => {
    setSelectedSprintOtDays(new Set());
  };

  // Add custom Sprint OT day
  const addCustomSprintOtDay = () => {
    if (customSprintOtDate.trim()) {
      const newDays = [...sprintOtDays, customSprintOtDate.trim()];
      setSprintOtDays(newDays);
      setSelectedSprintOtDays(new Set([...selectedSprintOtDays, customSprintOtDate.trim()]));
      setCustomSprintOtDate('');
    }
  };

  // Handle confirm sprint planning OT
  const handleConfirmSprintOt = async () => {
    const daysToProcess = Array.from(selectedSprintOtDays);
    console.log('Sprint planning OT confirmed for:', daysToProcess);
    setSprintDialogOpen(false);

    if (!token) {
      alert('Please enter your token first');
      return;
    }

    if (daysToProcess.length === 0) {
      alert('Please select at least one day');
      return;
    }

    // Format time: HH:MM:00
    const startTimeString = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}:00`;
    const endTimeString = `${String(selectedEndHour).padStart(2, '0')}:${String(selectedEndMinute).padStart(2, '0')}:00`;

    const results: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Make API requests for each Monday
    for (const day of daysToProcess) {
      try {
        // Parse the date: "November 18, 2025 (Monday)" -> "2025-11-18T00:00:00.000Z"
        const dateMatch = day.match(/(\w+)\s+(\d+),\s+(\d+)/);
        if (!dateMatch) continue;

        const [, monthName, dayNum, year] = dateMatch;
        const monthIndex = months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
        if (monthIndex === -1) continue;

        const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}T00:00:00.000Z`;

        // Prepare the request data based on the sample
        const requestData = {
          From: dateStr,
          To: dateStr,
          Type: "Period",
          GhiChu: "",
          CaDau: 0,
          CaGiua: 0,
          CaCuoi: 0,
          ReasonOT: "Sprint planning",
          Khoang1: {
            FromTime: startTimeString,
            ToTime: endTimeString,
            IsTomorrowFromTime: false,
            IsTomorrowToTime: false,
            DeclareDistributeOvertimeCosts: [
              {
                Start: startTimeString.substring(0, 5),
                IsStartTmw: false,
                End: endTimeString.substring(0, 5),
                IsEndTmr: false,
                Cost: null,
                EmployeeATID: null
              }
            ]
          },
          Khoang2: null,
          Khoang3: null,
          OTIndex1: 0,
          OTIndex2: 0,
          OTIndex3: 0,
          OTExamineFor1: 2,
          OTExamineFor2: 2,
          OTExamineFor3: 2,
          ScaleForSalary1: 0,
          ScaleForSalary2: 0,
          ScaleForSalary3: 0,
          WorkingPlace: "1",
          NotifyEmail: [],
          IsCalculateMealBill: false,
          UserRequest: ["60063"],
          OTType: 0,
          Reason1: {
            GroupReason: null,
            DetailReason: null,
            NoteOT: ""
          },
          Reason2: {
            GroupReason: null,
            DetailReason: null,
            NoteOT: ""
          },
          Reason3: {
            GroupReason: null,
            DetailReason: null,
            NoteOT: ""
          }
        };

        // Make the API request
        const response = await fetch('https://hrtool.larion.com:3106/api/TA_EmployeeOT/RegisterOT', {
          method: 'POST',
          headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
            'authorization': `bearer ${token}`,
            'cache-control': 'no-cache',
            'content-type': 'application/json;charset=UTF-8',
            'language': 'vi',
            'origin': 'https://hrtool.larion.com',
            'priority': 'u=1, i',
            'referer': 'https://hrtool.larion.com/',
            'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0'
          },
          body: JSON.stringify(requestData)
        });

        const responseData = await response.json();

        if (response.ok) {
          successCount++;
          results.push(`✅ ${day} (${startTimeString} - ${endTimeString}): SUCCESS - ${JSON.stringify(responseData)}`);
        } else {
          errorCount++;
          results.push(`❌ ${day} (${startTimeString} - ${endTimeString}): FAILED - ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
        }
      } catch (error) {
        errorCount++;
        results.push(`❌ ${day} (${startTimeString} - ${endTimeString}): ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Save results to file
    const fileContent = `# Sprint Planning OT Results\n# Generated on ${new Date().toISOString()}\n# For ${months[selectedMonth - 1]} ${selectedYear}\n# Time: ${startTimeString} - ${endTimeString}\n\nSummary:\n- Successful: ${successCount}\n- Failed: ${errorCount}\n- Total: ${daysToProcess.length}\n\nDetailed Results:\n\n${results.join('\n')}`;

    try {
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sprint_ot_results_${selectedYear}_${String(selectedMonth).padStart(2, '0')}_${String(selectedHour).padStart(2, '0')}${String(selectedMinute).padStart(2, '0')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`Sprint planning OT completed!\nSuccessful: ${successCount}\nFailed: ${errorCount}\nResults saved to file.`);
    } catch (error) {
      console.error('Error saving file:', error);
      alert(`Sprint planning OT completed!\nSuccessful: ${successCount}\nFailed: ${errorCount}\nError saving results file.`);
    }
  };

  // Handle cancel sprint planning OT
  const handleCancelSprintOt = () => {
    setSprintDialogOpen(false);
    setSprintOtDays([]);
    setSelectedSprintOtDays(new Set());
  };

  // Handle Weekly discussion OT button click
  const handleWeeklyDiscussionOt = () => {
    const days = generateWeeklyOtDays(selectedMonth, selectedYear);
    setWeeklyOtDays(days);
    setSelectedWeeklyOtDays(new Set(days)); // Select all by default
    setWeeklyDialogOpen(true);
  };

  // Toggle Weekly OT day selection
  const toggleWeeklyOtDay = (day: string) => {
    const newSelected = new Set(selectedWeeklyOtDays);
    if (newSelected.has(day)) {
      newSelected.delete(day);
    } else {
      newSelected.add(day);
    }
    setSelectedWeeklyOtDays(newSelected);
  };

  // Check all Weekly OT days
  const checkAllWeeklyOtDays = () => {
    setSelectedWeeklyOtDays(new Set(weeklyOtDays));
  };

  // Uncheck all Weekly OT days
  const uncheckAllWeeklyOtDays = () => {
    setSelectedWeeklyOtDays(new Set());
  };

  // Add custom Weekly OT day
  const addCustomWeeklyOtDay = () => {
    if (customWeeklyOtDate.trim()) {
      const newDays = [...weeklyOtDays, customWeeklyOtDate.trim()];
      setWeeklyOtDays(newDays);
      setSelectedWeeklyOtDays(new Set([...selectedWeeklyOtDays, customWeeklyOtDate.trim()]));
      setCustomWeeklyOtDate('');
    }
  };

  // Handle confirm Weekly discussion OT
  const handleConfirmWeeklyOt = async () => {
    const daysToProcess = Array.from(selectedWeeklyOtDays);
    console.log('Weekly discussion OT confirmed for:', daysToProcess);
    setWeeklyDialogOpen(false);

    if (!token) {
      alert('Please enter your token first');
      return;
    }

    if (daysToProcess.length === 0) {
      alert('Please select at least one day');
      return;
    }

    // Format time: HH:MM:00
    const startTimeString = `${String(weeklySelectedHour).padStart(2, '0')}:${String(weeklySelectedMinute).padStart(2, '0')}:00`;
    const endTimeString = `${String(weeklySelectedEndHour).padStart(2, '0')}:${String(weeklySelectedEndMinute).padStart(2, '0')}:00`;

    const results: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Make API requests for each Wednesday
    for (const day of daysToProcess) {
      try {
        // Parse the date: "November 12, 2025 (Wednesday)" -> "2025-11-12T00:00:00.000Z"
        const dateMatch = day.match(/(\w+)\s+(\d+),\s+(\d+)/);
        if (!dateMatch) continue;

        const [, monthName, dayNum, year] = dateMatch;
        const monthIndex = months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
        if (monthIndex === -1) continue;

        const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}T00:00:00.000Z`;

        // Prepare the request data based on the sample
        const requestData = {
          From: dateStr,
          To: dateStr,
          Type: "Period",
          GhiChu: "",
          CaDau: 0,
          CaGiua: 0,
          CaCuoi: 0,
          ReasonOT: "Weekly discussion",
          Khoang1: {
            FromTime: startTimeString,
            ToTime: endTimeString,
            IsTomorrowFromTime: false,
            IsTomorrowToTime: false,
            DeclareDistributeOvertimeCosts: [
              {
                Start: startTimeString.substring(0, 5),
                IsStartTmw: false,
                End: endTimeString.substring(0, 5),
                IsEndTmr: false,
                Cost: null,
                EmployeeATID: null
              }
            ]
          },
          Khoang2: null,
          Khoang3: null,
          OTIndex1: 0,
          OTIndex2: 0,
          OTIndex3: 0,
          OTExamineFor1: 2,
          OTExamineFor2: 2,
          OTExamineFor3: 2,
          ScaleForSalary1: 0,
          ScaleForSalary2: 0,
          ScaleForSalary3: 0,
          WorkingPlace: "1",
          NotifyEmail: [],
          IsCalculateMealBill: false,
          UserRequest: ["60063"],
          OTType: 0,
          Reason1: {
            GroupReason: null,
            DetailReason: null,
            NoteOT: ""
          },
          Reason2: {
            GroupReason: null,
            DetailReason: null,
            NoteOT: ""
          },
          Reason3: {
            GroupReason: null,
            DetailReason: null,
            NoteOT: ""
          }
        };

        // Make the API request
        const response = await fetch('https://hrtool.larion.com:3106/api/TA_EmployeeOT/RegisterOT', {
          method: 'POST',
          headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
            'authorization': `bearer ${token}`,
            'cache-control': 'no-cache',
            'content-type': 'application/json;charset=UTF-8',
            'language': 'vi',
            'origin': 'https://hrtool.larion.com',
            'priority': 'u=1, i',
            'referer': 'https://hrtool.larion.com/',
            'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0'
          },
          body: JSON.stringify(requestData)
        });

        const responseData = await response.json();

        if (response.ok) {
          successCount++;
          results.push(`✅ ${day} (${startTimeString} - ${endTimeString}): SUCCESS - ${JSON.stringify(responseData)}`);
        } else {
          errorCount++;
          results.push(`❌ ${day} (${startTimeString} - ${endTimeString}): FAILED - ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
        }
      } catch (error) {
        errorCount++;
        results.push(`❌ ${day} (${startTimeString} - ${endTimeString}): ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Save results to file
    const fileContent = `# Weekly Discussion OT Results\n# Generated on ${new Date().toISOString()}\n# For ${months[selectedMonth - 1]} ${selectedYear}\n# Time: ${startTimeString} - ${endTimeString}\n\nSummary:\n- Successful: ${successCount}\n- Failed: ${errorCount}\n- Total: ${daysToProcess.length}\n\nDetailed Results:\n\n${results.join('\n')}`;

    try {
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly_ot_results_${selectedYear}_${String(selectedMonth).padStart(2, '0')}_${String(weeklySelectedHour).padStart(2, '0')}${String(weeklySelectedMinute).padStart(2, '0')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`Weekly discussion OT completed!\nSuccessful: ${successCount}\nFailed: ${errorCount}\nResults saved to file.`);
    } catch (error) {
      console.error('Error saving file:', error);
      alert(`Weekly discussion OT completed!\nSuccessful: ${successCount}\nFailed: ${errorCount}\nError saving results file.`);
    }
  };

  // Handle cancel Weekly discussion OT
  const handleCancelWeeklyOt = () => {
    setWeeklyDialogOpen(false);
    setWeeklyOtDays([]);
    setSelectedWeeklyOtDays(new Set());
  };

  return (
    <div className="hrtool-page">
      <div className="hrtool-container">
        <h1>HRTool</h1>

        {/* Token Input Section */}
        <div className="form-section">
          <label htmlFor="token-input">Token:</label>
          <input
            id="token-input"
            type="text"
            value={token}
            onChange={handleTokenChange}
            placeholder="Enter your token"
            className="token-input"
          />
        </div>

        {/* Month and Year Selection */}
        <div className="form-section">
          <div className="date-selection">
            <div className="date-field">
              <label htmlFor="month-select">Month:</label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="date-select"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div className="date-field">
              <label htmlFor="year-select">Year:</label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="date-select"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-section">
          <h3>Actions:</h3>
          <div className="button-group">
            <button
              className="action-button primary"
              onClick={handleRegisterWfh}
            >
              Register WFH
            </button>

            <button
              className="action-button secondary"
              onClick={handleSprintPlanningOt}
            >
              Sprint planning OT
            </button>

            <button
              className="action-button tertiary"
              onClick={handleWeeklyDiscussionOt}
            >
              Weekly discussion OT
            </button>
          </div>
        </div>

        {/* Display Current Selection */}
        <div className="selection-display">
          <p>Current selection: {months[selectedMonth - 1]} {selectedYear}</p>
          {token && (
            <div className="token-display-container">
              <p className="text-xs text-gray-500 dark:text-gray-400">Token:</p>
              <div className="token-value-box">
                <p className="token-text">{token}</p>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-md rounded bg-white p-6">
              <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Confirm WFH Registration
              </Dialog.Title>

              <p className="text-sm text-gray-500 mb-4">
                Register WFH for every Wednesday, Thursday, and Friday in {months[selectedMonth - 1]} {selectedYear}?
              </p>

              <div className="mb-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">WFH Days:</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={checkAllWfhDays}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Check All
                    </button>
                    <button
                      onClick={uncheckAllWfhDays}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Uncheck All
                    </button>
                  </div>
                </div>

                <div className="wfh-days-list max-h-32 overflow-y-auto">
                  <ul className="text-sm text-gray-600 space-y-2">
                    {wfhDays.map((day, index) => (
                      <li key={index} className="py-1 flex items-center">
                        <input
                          type="checkbox"
                          id={`wfh-day-${index}`}
                          checked={selectedWfhDays.has(day)}
                          onChange={() => toggleWfhDay(day)}
                          className="mr-3 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor={`wfh-day-${index}`} className="cursor-pointer flex-1">
                          {day}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm font-medium text-gray-900">
                  Selected: {selectedWfhDays.size} / {wfhDays.length} days
                </p>

                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Add custom date:</label>
                  <p className="text-xs text-gray-500 mb-2">Format: Month Day, Year (e.g., May 10, 2026)</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customWfhDate}
                      onChange={(e) => setCustomWfhDate(e.target.value)}
                      placeholder="May 10, 2026"
                      className="flex-1 px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && addCustomWfhDay()}
                    />
                    <button
                      onClick={addCustomWfhDay}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={handleCancelWfh}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleConfirmWfh}
                >
                  Confirm
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Sprint Planning OT Dialog */}
        <Dialog open={sprintDialogOpen} onClose={() => setSprintDialogOpen(false)}>
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-md rounded bg-white p-6">
              <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Sprint Planning OT Registration
              </Dialog.Title>

              <p className="text-sm text-gray-500 mb-4">
                Register Sprint Planning OT for all Mondays in {months[selectedMonth - 1]} {selectedYear}?
              </p>

              {/* Time Selection */}
              <div className="mb-4 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Start Time:</h4>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-700 mb-1">Hour</label>
                      <select
                        value={selectedHour}
                        onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {String(i).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-700 mb-1">Minute</label>
                      <select
                        value={selectedMinute}
                        onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                      >
                        {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                          <option key={minute} value={minute}>
                            {String(minute).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">End Time:</h4>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-700 mb-1">Hour</label>
                      <select
                        value={selectedEndHour}
                        onChange={(e) => setSelectedEndHour(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {String(i).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-700 mb-1">Minute</label>
                      <select
                        value={selectedEndMinute}
                        onChange={(e) => setSelectedEndMinute(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                      >
                        {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                          <option key={minute} value={minute}>
                            {String(minute).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Selected time: {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')} - {String(selectedEndHour).padStart(2, '0')}:{String(selectedEndMinute).padStart(2, '0')}
                </p>
              </div>

              {/* Monday Days List */}
              <div className="mb-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Sprint Planning OT Days:</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={checkAllSprintOtDays}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Check All
                    </button>
                    <button
                      onClick={uncheckAllSprintOtDays}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Uncheck All
                    </button>
                  </div>
                </div>

                <div className="wfh-days-list max-h-32 overflow-y-auto">
                  <ul className="text-sm text-gray-600 space-y-2">
                    {sprintOtDays.map((day, index) => (
                      <li key={index} className="py-1 flex items-center">
                        <input
                          type="checkbox"
                          id={`sprint-ot-day-${index}`}
                          checked={selectedSprintOtDays.has(day)}
                          onChange={() => toggleSprintOtDay(day)}
                          className="mr-3 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor={`sprint-ot-day-${index}`} className="cursor-pointer flex-1">
                          {day}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm font-medium text-gray-900">
                  Selected: {selectedSprintOtDays.size} / {sprintOtDays.length} days
                </p>

                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Add custom date:</label>
                  <p className="text-xs text-gray-500 mb-2">Format: Month Day, Year (e.g., May 12, 2026)</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSprintOtDate}
                      onChange={(e) => setCustomSprintOtDate(e.target.value)}
                      placeholder="May 12, 2026"
                      className="flex-1 px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && addCustomSprintOtDay()}
                    />
                    <button
                      onClick={addCustomSprintOtDay}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={handleCancelSprintOt}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  onClick={handleConfirmSprintOt}
                >
                  Confirm
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Weekly Discussion OT Dialog */}
        <Dialog open={weeklyDialogOpen} onClose={() => setWeeklyDialogOpen(false)}>
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-md rounded bg-white p-6">
              <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Weekly Discussion OT Registration
              </Dialog.Title>

              <p className="text-sm text-gray-500 mb-4">
                Register Weekly Discussion OT for all Wednesdays in {months[selectedMonth - 1]} {selectedYear}?
              </p>

              {/* Time Selection */}
              <div className="mb-4 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Start Time:</h4>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-700 mb-1">Hour</label>
                      <select
                        value={weeklySelectedHour}
                        onChange={(e) => setWeeklySelectedHour(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {String(i).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-700 mb-1">Minute</label>
                      <select
                        value={weeklySelectedMinute}
                        onChange={(e) => setWeeklySelectedMinute(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                      >
                        {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                          <option key={minute} value={minute}>
                            {String(minute).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">End Time:</h4>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-700 mb-1">Hour</label>
                      <select
                        value={weeklySelectedEndHour}
                        onChange={(e) => setWeeklySelectedEndHour(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {String(i).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-700 mb-1">Minute</label>
                      <select
                        value={weeklySelectedEndMinute}
                        onChange={(e) => setWeeklySelectedEndMinute(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                      >
                        {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                          <option key={minute} value={minute}>
                            {String(minute).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Selected time: {String(weeklySelectedHour).padStart(2, '0')}:{String(weeklySelectedMinute).padStart(2, '0')} - {String(weeklySelectedEndHour).padStart(2, '0')}:{String(weeklySelectedEndMinute).padStart(2, '0')}
                </p>
              </div>

              {/* Wednesday Days List */}
              <div className="mb-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Weekly Discussion OT Days:</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={checkAllWeeklyOtDays}
                      className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                      Check All
                    </button>
                    <button
                      onClick={uncheckAllWeeklyOtDays}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Uncheck All
                    </button>
                  </div>
                </div>

                <div className="wfh-days-list max-h-32 overflow-y-auto">
                  <ul className="text-sm text-gray-600 space-y-2">
                    {weeklyOtDays.map((day, index) => (
                      <li key={index} className="py-1 flex items-center">
                        <input
                          type="checkbox"
                          id={`weekly-ot-day-${index}`}
                          checked={selectedWeeklyOtDays.has(day)}
                          onChange={() => toggleWeeklyOtDay(day)}
                          className="mr-3 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor={`weekly-ot-day-${index}`} className="cursor-pointer flex-1">
                          {day}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm font-medium text-gray-900">
                  Selected: {selectedWeeklyOtDays.size} / {weeklyOtDays.length} days
                </p>

                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Add custom date:</label>
                  <p className="text-xs text-gray-500 mb-2">Format: Month Day, Year (e.g., May 14, 2026)</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customWeeklyOtDate}
                      onChange={(e) => setCustomWeeklyOtDate(e.target.value)}
                      placeholder="May 14, 2026"
                      className="flex-1 px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && addCustomWeeklyOtDay()}
                    />
                    <button
                      onClick={addCustomWeeklyOtDay}
                      className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={handleCancelWeeklyOt}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onClick={handleConfirmWeeklyOt}
                >
                  Confirm
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
