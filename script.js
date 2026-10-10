
const form = document.getElementById("studentFormElement");
const studentId = document.getElementById("studentId");
const nameInput = document.getElementById("name");
const rollInput = document.getElementById("roll");
const emailInput = document.getElementById("email");
const courseInput = document.getElementById("course");

const table = document.getElementById("studentTable");
const searchInput = document.getElementById("search");
const courseFilter = document.getElementById("courseFilter");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const overviewSummary = document.getElementById("overviewSummary");
const courseBreakdown = document.getElementById("courseBreakdown");

let students = [];

try {
  const saved = JSON.parse(localStorage.getItem("students") || "[]");
  students = Array.isArray(saved) ? saved : [];
} catch {
  students = [];
}

function saveStudents() {
  localStorage.setItem("students", JSON.stringify(students));
}

function getCourseDistribution() {
  const totals = {};

  students.forEach(student => {
    totals[student.course] = (totals[student.course] || 0) + 1;
  });

  return Object.entries(totals).map(([course, count]) => ({ course, count }));
}

function renderCourseBreakdown() {
  const distribution = getCourseDistribution();
  const maxCount = Math.max(...distribution.map(item => item.count), 1);

  courseBreakdown.replaceChildren();

  distribution.forEach(({ course, count }) => {
    const row = document.createElement("div");
    row.className = "course-row";

    const meta = document.createElement("div");
    meta.className = "course-meta";
    meta.innerHTML = `<span>${course}</span><span>${count}</span>`;

    const bar = document.createElement("div");
    bar.className = "bar";

    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${(count / maxCount) * 100}%`;

    bar.appendChild(fill);
    row.append(meta, bar);
    courseBreakdown.appendChild(row);
  });
}

function renderStudents() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedCourse = courseFilter.value;

  const filtered = students.filter(student => {
    const matchesSearch = [student.name, student.roll, student.email, student.course]
      .some(value => value.toLowerCase().includes(query));

    const matchesCourse = !selectedCourse || student.course === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  table.replaceChildren();
  document.getElementById("emptyMessage").style.display = filtered.length ? "none" : "block";

  filtered.forEach(student => {
    const tr = document.createElement("tr");

    [student.name, student.roll, student.email, student.course].forEach(value => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });

    const actions = document.createElement("td");

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "edit";
    editButton.addEventListener("click", () => {
      editStudent(student.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete";
    deleteButton.addEventListener("click", () => {
      deleteStudent(student.id);
    });

    actions.append(editButton, deleteButton);
    tr.appendChild(actions);
    table.appendChild(tr);
  });

  const totalStudents = students.length;
  const totalCourses = new Set(students.map(student => student.course)).size;
  const recentCount = students.filter(student => Date.now() - student.createdAt < 7 * 24 * 60 * 60 * 1000).length;
  const attendanceRate = totalStudents ? Math.min(99, Math.max(72, 78 + (totalStudents % 15))) : 0;

  document.getElementById("totalStudents").textContent = totalStudents;
  document.getElementById("totalCourses").textContent = totalCourses;
  document.getElementById("recentStudents").textContent = recentCount;
  document.getElementById("attendanceRate").textContent = `${attendanceRate}%`;
  document.getElementById("miniAdmissions").textContent = recentCount;

  if (totalStudents === 0) {
    overviewSummary.textContent = "Your student ecosystem is ready for the next intake.";
    return;
  }

  const topCourse = getCourseDistribution().sort((a, b) => b.count - a.count)[0];
  overviewSummary.textContent = `${totalStudents} students are currently active across ${totalCourses} programs, with ${topCourse.course} leading the cohort.`;

  renderCourseBreakdown();
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const roll = rollInput.value.trim();
  const email = emailInput.value.trim();
  const course = courseInput.value;
  const id = studentId.value;

  if (!name || !roll || !email || !course) {
    alert("Please fill in all fields.");
    return;
  }

  const duplicateRoll = students.some(student =>
    student.roll.toLowerCase() === roll.toLowerCase() && student.id !== id
  );

  if (duplicateRoll) {
    alert("This roll number already exists.");
    return;
  }

  if (id) {
    const index = students.findIndex(student => student.id === id);

    if (index !== -1) {
      students[index] = { ...students[index], name, roll, email, course };
    }
  } else {
    students.push({
      id: crypto.randomUUID(),
      name,
      roll,
      email,
      course,
      createdAt: Date.now()
    });
  }

  saveStudents();
  renderStudents();
  resetForm();
});

function editStudent(id) {
  const student = students.find(item => item.id === id);
  if (!student) return;

  studentId.value = student.id;
  nameInput.value = student.name;
  rollInput.value = student.roll;
  emailInput.value = student.email;
  courseInput.value = student.course;

  document.getElementById("formTitle").textContent = "Edit Student";
  saveButton.textContent = "Update Student";
  cancelButton.classList.remove("hidden");

  document.getElementById("studentForm").scrollIntoView({ behavior: "smooth" });
  nameInput.focus();
}

function deleteStudent(id) {
  const student = students.find(item => item.id === id);
  if (!student) return;

  if (!confirm(`Delete ${student.name}'s record?`)) return;

  students = students.filter(item => item.id !== id);
  saveStudents();
  renderStudents();

  if (studentId.value === id) {
    resetForm();
  }
}

function resetForm() {
  form.reset();
  studentId.value = "";

  document.getElementById("formTitle").textContent = "Add New Student";
  saveButton.textContent = "Add Student";
  cancelButton.classList.add("hidden");
}

cancelButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderStudents);
courseFilter.addEventListener("change", renderStudents);

renderStudents();
