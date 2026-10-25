"use strict";

const STORAGE_KEY = "studentHubRecords";

let students = loadStudents();

const studentForm = document.getElementById("studentForm");
const studentIdInput = document.getElementById("studentId");
const studentNameInput = document.getElementById("studentName");
const studentEmailInput = document.getElementById("studentEmail");
const studentPhoneInput = document.getElementById("studentPhone");
const studentCourseInput = document.getElementById("studentCourse");
const studentYearInput = document.getElementById("studentYear");
const editIdInput = document.getElementById("editId");

const studentTableBody = document.getElementById("studentTableBody");
const searchInput = document.getElementById("searchInput");
const courseFilter = document.getElementById("courseFilter");
const yearFilter = document.getElementById("yearFilter");

const formMessage = document.getElementById("formMessage");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEdit");

/* Load records saved in the browser */

function loadStudents() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

/* Save records */

function saveStudents() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
        return true;
    } catch (error) {
        showMessage(
            "Unable to save records. Browser storage may be unavailable.",
            "error"
        );
        return false;
    }
}

/* Display messages */

function showMessage(message, type = "") {
    formMessage.textContent = message;
    formMessage.className = type;
}

/* Reset form */

function clearForm() {
    studentForm.reset();
    editIdInput.value = "";
    formTitle.textContent = "Add New Student";
    submitBtn.textContent = "+ Add Student";
    cancelEditBtn.classList.add("hidden");
}

/* Year labels */

function getYearLabel(year) {
    const labels = {
        "1": "First Year",
        "2": "Second Year",
        "3": "Third Year",
        "4": "Fourth Year"
    };

    return labels[year] || year;
}

/* Dashboard statistics */

function updateDashboard() {
    document.getElementById("totalStudents").textContent =
        students.length;

    const uniqueCourses = new Set(
        students.map(student => student.course)
    );

    document.getElementById("totalCourses").textContent =
        uniqueCourses.size;

    document.getElementById("firstYearStudents").textContent =
        students.filter(student => student.year === "1").length;

    document.getElementById("secondYearStudents").textContent =
        students.filter(student => student.year === "2").length;
}

/* Create safe table cells */

function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
}

/* Render student records */

function renderStudents() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedCourse = courseFilter.value;
    const selectedYear = yearFilter.value;

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.name.toLowerCase().includes(query) ||
            student.studentId.toLowerCase().includes(query);

        const matchesCourse =
            !selectedCourse || student.course === selectedCourse;

        const matchesYear =
            !selectedYear || student.year === selectedYear;

        return matchesSearch && matchesCourse && matchesYear;
    });

    studentTableBody.replaceChildren();

    filteredStudents.forEach(student => {
        const row = document.createElement("tr");

        const idCell = createCell("");
        const badge = document.createElement("span");
        badge.className = "student-id-badge";
        badge.textContent = student.studentId;
        idCell.appendChild(badge);

        row.append(
            idCell,
            createCell(student.name),
            createCell(student.email),
            createCell(student.phone),
            createCell(student.course),
            createCell(getYearLabel(student.year))
        );

        const actionCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "action-buttons";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-btn";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editStudent(student.id));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteStudent(student.id));

        actions.append(editButton, deleteButton);
        actionCell.appendChild(actions);
        row.appendChild(actionCell);

        studentTableBody.appendChild(row);
    });

    const emptyMessage = document.getElementById("emptyMessage");

    emptyMessage.classList.toggle(
        "hidden",
        filteredStudents.length > 0
    );

    if (filteredStudents.length === 0 && students.length > 0) {
        emptyMessage.querySelector("h3").textContent =
            "No matching students found";

        emptyMessage.querySelector("p").textContent =
            "Try changing your search or filters.";
    } else if (students.length === 0) {
        emptyMessage.querySelector("h3").textContent =
            "No student records yet";

        emptyMessage.querySelector("p").textContent =
            "Add a student using the form above to get started.";
    }

    updateDashboard();
}

/* Add or update a student */

studentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const student = {
        studentId: studentIdInput.value.trim(),
        name: studentNameInput.value.trim(),
        email: studentEmailInput.value.trim(),
        phone: studentPhoneInput.value.trim(),
        course: studentCourseInput.value,
        year: studentYearInput.value
    };

    const editingId = editIdInput.value;

    if (student.name.length < 2) {
        showMessage("Please enter a valid student name.", "error");
        return;
    }

    if (!/^[0-9]{10}$/.test(student.phone)) {
        showMessage("Phone number must contain exactly 10 digits.", "error");
        return;
    }

    const duplicateId = students.some(existing =>
        existing.studentId.toLowerCase() === student.studentId.toLowerCase() &&
        existing.id !== editingId
    );

    if (duplicateId) {
        showMessage("This Student ID already exists.", "error");
        return;
    }

    const duplicateEmail = students.some(existing =>
        existing.email.toLowerCase() === student.email.toLowerCase() &&
        existing.id !== editingId
    );

    if (duplicateEmail) {
        showMessage("This email address is already registered.", "error");
        return;
    }

    const previousStudents = students.map(item => ({ ...item }));

    if (editingId) {
        const index = students.findIndex(item => item.id === editingId);

        if (index === -1) {
            showMessage("Student record was not found.", "error");
            clearForm();
            return;
        }

        students[index] = {
            ...students[index],
            ...student
        };
    } else {
        const newStudent = {
            id: (window.crypto && crypto.randomUUID)
                ? crypto.randomUUID()
                : String(Date.now()) + Math.random().toString(16).slice(2),
            ...student
        };

        students.push(newStudent);
    }

    if (!saveStudents()) {
        students = previousStudents;
        renderStudents();
        return;
    }

    clearForm();

    showMessage(
        editingId
            ? "Student details updated successfully."
            : "Student added successfully.",
        "success"
    );

    renderStudents();
});

/* Edit student */

function editStudent(id) {
    const student = students.find(item => item.id === id);

    if (!student) return;

    editIdInput.value = student.id;
    studentIdInput.value = student.studentId;
    studentNameInput.value = student.name;
    studentEmailInput.value = student.email;
    studentPhoneInput.value = student.phone;
    studentCourseInput.value = student.course;
    studentYearInput.value = student.year;

    formTitle.textContent = "Edit Student";
    submitBtn.textContent = "Update Student";
    cancelEditBtn.classList.remove("hidden");

    showMessage("Update the fields and click Update Student.", "success");

    document.getElementById("studentFormSection").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* Delete student */

function deleteStudent(id) {
    const student = students.find(item => item.id === id);

    if (!student) return;

    const confirmed = confirm(
        `Are you sure you want to delete ${student.name}?`
    );

    if (!confirmed) return;

    const previousStudents = students;
    students = students.filter(item => item.id !== id);

    if (!saveStudents()) {
        students = previousStudents;
        renderStudents();
        return;
    }

    if (editIdInput.value === id) {
        clearForm();
    }

    showMessage("Student deleted successfully.", "success");
    renderStudents();
}

/* Cancel edit */

cancelEditBtn.addEventListener("click", function () {
    clearForm();
    showMessage("", "");
});

/* Search and filters */

searchInput.addEventListener("input", renderStudents);
courseFilter.addEventListener("change", renderStudents);
yearFilter.addEventListener("change", renderStudents);

/* Dark mode */

document.getElementById("themeToggle").addEventListener("click", function () {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    this.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});

/* Export student records to CSV */

document.getElementById("exportBtn").addEventListener("click", function () {
    if (students.length === 0) {
        showMessage("No student records available to export.", "error");
        return;
    }

    const headers = [
        "Student ID",
        "Full Name",
        "Email",
        "Phone",
        "Course",
        "Academic Year"
    ];

    const rows = students.map(student => [
        student.studentId,
        student.name,
        student.email,
        student.phone,
        student.course,
        getYearLabel(student.year)
    ]);

    function escapeCSV(value) {
        let text = String(value ?? "");

        if (/^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }

        return '"' + text.replace(/"/g, '""') + '"';
    }

    const csv = [headers, ...rows]
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "student-records.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showMessage("Student records exported successfully.", "success");
});

/* Initial display */

renderStudents();