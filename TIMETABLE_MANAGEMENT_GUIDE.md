# Timetable Management Guide

## Overview

The Timetable Management system allows administrators to create, edit, and manage class schedules for all classes in the school. This comprehensive tool provides a visual interface for organizing daily schedules with subjects, teachers, rooms, and time slots.

## 🚀 Features

### **Core Functionality**
- **Visual Timetable Editor**: Drag-and-drop interface for easy schedule management
- **Multi-Class Support**: Manage timetables for all classes (6-12)
- **Teacher Assignment**: Assign teachers to specific subjects and time slots
- **Room Management**: Allocate classrooms, labs, and special facilities
- **Time Slot Management**: Flexible 15-minute time slots from 8:00 AM to 5:00 PM

### **Advanced Features**
- **Copy Timetables**: Copy schedules from one class to another
- **Export/Import**: Export timetables as CSV files
- **Break Management**: Add breaks and lunch periods
- **Conflict Detection**: Prevent scheduling conflicts
- **Real-time Updates**: Instant synchronization with the database

## 📋 Access Requirements

### **User Roles**
- **Admin**: Full access to timetable management
- **Main Admin**: Full access + additional privileges
- **Teacher**: View-only access to their assigned classes
- **Student**: View-only access to their class timetable

### **Navigation**
1. Login as Admin/Main Admin
2. Go to Dashboard
3. Click "Timetable Management" in the sidebar
4. Or use the quick access card on the admin dashboard

## 🎯 How to Use

### **1. Accessing Timetable Management**

**Method 1: Sidebar Navigation**
- Click on "Timetable Management" in the left sidebar
- Available only for Admin and Main Admin users

**Method 2: Quick Access Card**
- On the admin dashboard, click the "Timetable Management" card
- Provides direct access to the timetable editor

### **2. Selecting a Class**

1. Use the class selector in the top-right corner
2. Choose from available classes:
   - Class 6-A, 6-B
   - Class 7-A, 7-B
   - Class 8-A, 8-B
   - Class 9-A, 9-B
   - Class 10-A, 10-B
   - Class 11-A, 11-B
   - Class 12-A, 12-B

### **3. Adding Periods**

**Step-by-Step Process:**
1. Click the "+" button on any day card
2. Fill in the period details:
   - **Type**: Subject, Break, or Lunch
   - **Subject**: Choose from predefined subjects (for subject periods)
   - **Teacher**: Select from available teachers (for subject periods)
   - **Room**: Choose classroom or facility
   - **Start Time**: Select from 15-minute intervals
   - **End Time**: Select from 15-minute intervals
3. Click "Save" to add the period

**Available Subjects:**
- Mathematics, Physics, Chemistry, Biology
- English, Hindi, Gujarati, Sanskrit
- History, Geography, Computer Science
- Economics, Business Studies, Accountancy, Statistics

**Available Rooms:**
- Regular Classrooms: Room 101, 102, 103, 201, 202, 203
- Specialized Facilities: Lab 1, Lab 2, Computer Lab
- Common Areas: Library, Auditorium, Sports Ground

### **4. Editing Periods**

1. Click the edit icon (pencil) on any period card
2. Modify the period details as needed
3. Click "Save" to update the period

### **5. Deleting Periods**

1. Click the delete icon (trash) on any period card
2. Confirm the deletion
3. Period will be removed from the schedule

### **6. Copying Timetables**

**Copy from Another Class:**
1. Click "Copy from Another Class" button
2. Select the source class from the dropdown
3. Click "Copy Timetable"
4. The entire timetable will be copied to the current class

**Use Cases:**
- Copy a well-structured timetable to similar classes
- Use a template timetable for new classes
- Standardize schedules across parallel sections

### **7. Exporting Timetables**

1. Click "Export" button
2. Timetable will be downloaded as a CSV file
3. File includes: Day, Subject, Teacher, Start Time, End Time, Room, Type

## 📅 Schedule Structure

### **Default Time Slots**
- **Morning Session**: 8:00 AM - 12:00 PM
- **Lunch Break**: 12:00 PM - 1:00 PM
- **Afternoon Session**: 1:00 PM - 5:00 PM
- **Break Times**: 10:00 AM - 10:20 AM, 2:00 PM - 2:20 PM

### **Recommended Schedule Pattern**
```
8:00 - 9:00   | Period 1
9:00 - 10:00  | Period 2
10:00 - 10:20 | Break
10:20 - 11:20 | Period 3
11:20 - 12:20 | Period 4
12:20 - 1:20  | Lunch
1:20 - 2:20   | Period 5
2:20 - 2:40   | Break
2:40 - 3:40   | Period 6
3:40 - 4:40   | Period 7
```

## 🔧 Technical Details

### **Data Storage**
- **Collection**: `timetables`
- **Document ID**: `{class}-{day}` (e.g., `class-10-a-Monday`)
- **Structure**:
```json
{
  "periods": [
    {
      "id": "unique-id",
      "subject": "Mathematics",
      "teacher": "Dr. Sarah Johnson",
      "startTime": "08:00",
      "endTime": "09:00",
      "room": "Room 201",
      "type": "subject"
    }
  ]
}
```

### **Time Slot System**
- **Granularity**: 15-minute intervals
- **Range**: 8:00 AM to 5:00 PM
- **Format**: 24-hour format (HH:MM)
- **Validation**: End time must be after start time

### **Conflict Prevention**
- **Teacher Conflicts**: Same teacher cannot be in multiple classes simultaneously
- **Room Conflicts**: Same room cannot be used by multiple classes at the same time
- **Time Overlaps**: Periods cannot overlap within the same class

## 🎨 User Interface

### **Visual Design**
- **Day Cards**: Each day displayed as a separate card
- **Period Cards**: Color-coded by type:
  - **Blue**: Subject periods
  - **Yellow**: Break periods
  - **Green**: Lunch periods
- **Responsive Layout**: Works on desktop, tablet, and mobile

### **Interactive Elements**
- **Add Button**: "+" icon on each day card
- **Edit Button**: Pencil icon on each period card
- **Delete Button**: Trash icon on each period card
- **Copy Button**: Copy icon in the header
- **Export Button**: Download icon in the header

## 📊 Best Practices

### **Scheduling Guidelines**

1. **Balance Subjects**
   - Distribute core subjects throughout the week
   - Avoid consecutive periods of the same subject
   - Consider student attention spans

2. **Teacher Workload**
   - Distribute teacher assignments evenly
   - Consider teacher preferences and expertise
   - Avoid back-to-back classes for the same teacher

3. **Room Utilization**
   - Use specialized rooms for practical subjects
   - Consider class sizes and room capacities
   - Plan for lab sessions and practical work

4. **Break Management**
   - Include adequate break times
   - Consider lunch timing for all classes
   - Plan for assembly or special activities

### **Administrative Tips**

1. **Planning Phase**
   - Review teacher availability first
   - Consider school policies and constraints
   - Plan for special events and holidays

2. **Implementation**
   - Start with core subjects
   - Add breaks and lunch periods
   - Fill in remaining subjects

3. **Review and Adjust**
   - Check for conflicts before finalizing
   - Get feedback from teachers
   - Make adjustments as needed

## 🔍 Troubleshooting

### **Common Issues**

1. **Period Not Saving**
   - Check internet connection
   - Verify all required fields are filled
   - Ensure time slots are valid

2. **Copy Function Not Working**
   - Verify source class has a timetable
   - Check user permissions
   - Refresh the page and try again

3. **Export Issues**
   - Check browser download settings
   - Ensure timetable has data to export
   - Try different browser if issues persist

### **Error Messages**

- **"Subject is required"**: Fill in the subject field for subject periods
- **"Failed to save schedule"**: Check network connection and try again
- **"Access denied"**: Verify user has admin privileges

## 🔮 Future Enhancements

### **Planned Features**
1. **Drag-and-Drop Interface**: Visual timetable editing
2. **Conflict Detection**: Real-time conflict warnings
3. **Teacher Availability**: Integration with teacher schedules
4. **Room Booking**: Advanced room management system
5. **Timetable Templates**: Pre-built schedule templates
6. **Mobile App**: Dedicated mobile application
7. **Notifications**: Schedule change notifications
8. **Analytics**: Timetable usage and optimization reports

### **Advanced Features**
1. **AI-Powered Scheduling**: Automated timetable generation
2. **Multi-School Support**: Manage multiple school timetables
3. **Integration**: Connect with other school management systems
4. **Customization**: School-specific subject and room configurations

## 📞 Support

### **Getting Help**
- **Documentation**: Refer to this guide for detailed instructions
- **Admin Support**: Contact system administrator for technical issues
- **Training**: Request training sessions for new administrators

### **Feedback**
- **Feature Requests**: Submit suggestions for new features
- **Bug Reports**: Report any issues or errors
- **Improvements**: Share ideas for system enhancements

---

This timetable management system provides a comprehensive solution for organizing and managing class schedules efficiently. With its user-friendly interface and powerful features, administrators can create well-structured timetables that optimize learning outcomes and resource utilization. 