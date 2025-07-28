# CSV Format Guide for Timetable Import

## 📋 Overview

This guide explains the exact CSV format required for importing timetables into the Smart Class Command system. The CSV file allows administrators to bulk import class schedules with all necessary details including subjects, teachers, rooms, and time slots.

## 📊 CSV Structure

### **Required Columns (in order):**

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| **Day** | ✅ Yes | Day of the week | `Monday`, `Tuesday`, etc. |
| **Subject** | ⚠️ Conditional | Subject name | `Mathematics`, `Physics`, etc. |
| **Teacher** | ⚠️ Conditional | Teacher name | `Dr. Sarah Johnson` |
| **StartTime** | ✅ Yes | Start time (HH:MM) | `08:00`, `09:15` |
| **EndTime** | ✅ Yes | End time (HH:MM) | `09:00`, `10:15` |
| **Room** | ⚠️ Conditional | Room name | `Room 201`, `Lab 1` |
| **Type** | ✅ Yes | Period type | `subject`, `break`, `lunch` |

### **Header Row**
```csv
Day,Subject,Teacher,StartTime,EndTime,Room,Type
```

## 📝 Data Format Rules

### **1. Day Column**
- **Valid Values**: `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`
- **Case**: Case-sensitive, must match exactly
- **Required**: Yes, cannot be empty

### **2. Subject Column**
- **Required For**: `Type = "subject"`
- **Optional For**: `Type = "break"` or `Type = "lunch"`
- **Valid Subjects**:
  - Mathematics, Physics, Chemistry, Biology
  - English, Hindi, Gujarati, Sanskrit
  - History, Geography, Computer Science
  - Economics, Business Studies, Accountancy, Statistics

### **3. Teacher Column**
- **Required For**: `Type = "subject"`
- **Optional For**: `Type = "break"` or `Type = "lunch"`
- **Format**: Full name (e.g., `Dr. Sarah Johnson`)
- **Must Exist**: Teacher must be registered in the system

### **4. StartTime Column**
- **Format**: 24-hour format (HH:MM)
- **Range**: 08:00 to 16:45
- **Interval**: 15-minute intervals
- **Examples**: `08:00`, `08:15`, `08:30`, `08:45`, `09:00`

### **5. EndTime Column**
- **Format**: 24-hour format (HH:MM)
- **Range**: 08:15 to 17:00
- **Must Be**: After StartTime
- **Examples**: `09:00`, `09:15`, `09:30`, `09:45`, `10:00`

### **6. Room Column**
- **Required For**: `Type = "subject"`
- **Optional For**: `Type = "break"` or `Type = "lunch"`
- **Valid Rooms**:
  - Regular Classrooms: `Room 101`, `Room 102`, `Room 103`, `Room 201`, `Room 202`, `Room 203`
  - Specialized Facilities: `Lab 1`, `Lab 2`, `Computer Lab`
  - Common Areas: `Library`, `Auditorium`, `Sports Ground`

### **7. Type Column**
- **Valid Values**: `subject`, `break`, `lunch`
- **Case**: Case-sensitive, must be lowercase
- **Required**: Yes, cannot be empty

## 📋 Complete Example

### **Sample CSV Content:**
```csv
Day,Subject,Teacher,StartTime,EndTime,Room,Type
Monday,Mathematics,Dr. Sarah Johnson,08:00,09:00,Room 201,subject
Monday,,,09:00,09:20,,break
Monday,Physics,Prof. Michael Chen,09:20,10:20,Lab 1,subject
Monday,Chemistry,Dr. Emily Davis,10:20,11:20,Lab 2,subject
Monday,English,Ms. Rachel Green,11:20,12:20,Room 202,subject
Monday,,,12:20,13:20,,lunch
Monday,Biology,Mr. John Smith,13:20,14:20,Room 203,subject
Monday,,,14:20,14:40,,break
Monday,Computer Science,Ms. Priya Patel,14:40,15:40,Computer Lab,subject
Monday,History,Mr. David Lee,15:40,16:40,Room 101,subject
```

## ⚠️ Validation Rules

### **Required Field Validation**
1. **Day**: Must be a valid weekday
2. **StartTime**: Must be in HH:MM format
3. **EndTime**: Must be in HH:MM format
4. **Type**: Must be `subject`, `break`, or `lunch`

### **Conditional Field Validation**
1. **For Type = "subject"**:
   - Subject: Required
   - Teacher: Required
   - Room: Required

2. **For Type = "break" or "lunch"**:
   - Subject: Optional (leave empty)
   - Teacher: Optional (leave empty)
   - Room: Optional (leave empty)

### **Time Validation**
1. **Format**: Must be HH:MM (24-hour format)
2. **Range**: 08:00 to 16:45 for StartTime, 08:15 to 17:00 for EndTime
3. **Logic**: EndTime must be after StartTime
4. **Intervals**: Should use 15-minute intervals

### **Data Integrity**
1. **Teacher Existence**: Teacher must be registered in the system
2. **Room Availability**: Room must be valid
3. **Subject Validity**: Subject must be from the predefined list
4. **No Overlaps**: Periods should not overlap within the same day

## 🔧 Common Issues & Solutions

### **1. Time Format Errors**
**Problem**: `9:00` instead of `09:00`
**Solution**: Always use two digits for hours (HH:MM)

### **2. Invalid Day Names**
**Problem**: `monday` instead of `Monday`
**Solution**: Use proper case: `Monday`, `Tuesday`, etc.

### **3. Missing Required Fields**
**Problem**: Empty Subject for subject type
**Solution**: Fill all required fields based on Type

### **4. Time Logic Errors**
**Problem**: EndTime before StartTime
**Solution**: Ensure EndTime is after StartTime

### **5. Invalid Type Values**
**Problem**: `Subject` instead of `subject`
**Solution**: Use lowercase: `subject`, `break`, `lunch`

## 📁 File Requirements

### **File Format**
- **Extension**: `.csv`
- **Encoding**: UTF-8
- **Delimiter**: Comma (`,`)
- **Line Endings**: Unix (LF) or Windows (CRLF)

### **File Size**
- **Maximum**: 1MB
- **Recommended**: Under 100KB for typical timetables

### **Row Limits**
- **Maximum Rows**: 500
- **Typical Usage**: 50-100 rows per class

## 🚀 Import Process

### **Step-by-Step Import**
1. **Prepare CSV**: Create file following this format
2. **Validate Data**: Check all validation rules
3. **Upload File**: Use "Import CSV" button in Timetable Manager
4. **Review Preview**: Check the data preview
5. **Fix Errors**: Address any validation errors
6. **Import**: Click "Import Timetable" to complete

### **Import Options**
- **Replace Existing**: Completely replaces current timetable
- **Merge**: Adds new periods to existing timetable (future feature)
- **Validate Only**: Check format without importing (future feature)

## 📊 Advanced Usage

### **Creating Templates**
1. Download the template from the import modal
2. Modify with your school's specific data
3. Use as a base for all class timetables

### **Bulk Operations**
1. Create one template per class
2. Modify teacher assignments as needed
3. Import each class separately

### **Data Migration**
1. Export existing timetables
2. Modify in spreadsheet software
3. Re-import with updates

## 🔍 Troubleshooting

### **Import Fails**
1. Check file format (must be .csv)
2. Verify column headers match exactly
3. Ensure all required fields are filled
4. Check for time format errors

### **Validation Errors**
1. Review error messages in the import modal
2. Fix each error row by row
3. Re-upload the corrected file

### **Data Not Appearing**
1. Check if import completed successfully
2. Verify the correct class is selected
3. Refresh the timetable view

## 📞 Support

### **Getting Help**
- **Template Download**: Use the download button in the import modal
- **Validation**: Check error messages for specific issues
- **Documentation**: Refer to this guide for format requirements

### **Best Practices**
1. **Test with Small Files**: Start with a few periods to test
2. **Backup Existing Data**: Export current timetables before importing
3. **Validate Before Import**: Check all data in the preview
4. **Use Templates**: Download and modify the provided template

---

This CSV format ensures consistent and accurate timetable imports while maintaining data integrity and preventing scheduling conflicts. 