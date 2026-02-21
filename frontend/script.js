const API = "http://localhost:5000";
const ADMIN_HEADER = { Authorization: "admin-authenticated" };
let reportsData = []; // Store reports data globally

/* LOGIN */
document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  const res = await fetch(API + "/admin-login", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username.value,
      password: password.value
    })
  });

  const data = await res.json();
  if (data.success) {
    localStorage.setItem("admin", "true");
    location.href = "admin.html";
  } else alert("Invalid login");
});

/* LOAD REPORTS */
async function loadReports() {
  const res = await fetch(API + "/reports");
  const data = await res.json();
  reportsData = data; // Store data globally

  const list = document.getElementById("reportList");
  const admin = document.getElementById("adminReports");

  if (list) {
    list.innerHTML = "";
    data.forEach(r => {
      const name = r.name || 'Anonymous';
      const location = r.location || 'Not Specified';
      const detailsSnippet = r.details ? (r.details.substring(0, 50) + (r.details.length > 50 ? '...' : '')) : 'No details';
      const status = r.status || 'Pending';

      list.innerHTML += `<li onclick="showReportDetails('${r._id}')" style="cursor: pointer; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); list-style: none;">
     <div style="font-weight: bold; color: #ffd60a; font-size: 1.1em;">📍 ${location}</div>
     <div style="font-size: 0.9em; color: #eee; margin: 4px 0;">👤 Reported by: ${name}</div>
     <div style="font-size: 0.85em; color: #ccc; font-style: italic;">📝 ${detailsSnippet}</div>
     <div style="margin-top: 8px;"><span class="${status === 'Pending' ? 'pending' : 'resolved'}">${status}</span></div>
   </li>`;
    });
  }

  if (admin) {
    admin.innerHTML = "";
    data.forEach(r => {
      // Use location if available, otherwise show what we have
      const displayText = r.location && r.location !== 'undefined' ? r.location : (r.name && r.name !== 'undefined' ? `Reported by ${r.name}` : 'Report');
      const status = r.status || 'Pending';
      admin.innerHTML += `<li onclick="showReportDetails('${r._id}')" style="cursor: pointer;">
   ${displayText} (${status})
   <button onclick="event.stopPropagation(); resolve('${r._id}')">Resolve</button>
   <button onclick="event.stopPropagation(); del('${r._id}')">Delete</button>
   </li>`;
    });
  }
}
loadReports();

/* SUBMIT REPORT */
function setupReportForm() {
  const reportForm = document.getElementById('reportForm');
  if (!reportForm) return;

  reportForm.addEventListener("submit", async e => {
    e.preventDefault();

    // Get form values - allow empty values
    const name = (document.querySelector('#reportForm [name="name"]')?.value || '').trim();
    const location = (document.querySelector('#reportForm [name="location"]')?.value || '').trim();
    const details = (document.querySelector('#reportForm [name="details"]')?.value || '').trim();

    // Use actual values or fallback
    const reportName = name || 'Anonymous';
    const reportLocation = location || 'Not Specified';
    const reportDetails = details || 'No details provided';

    // Create FormData and explicitly add all fields
    const fd = new FormData();
    fd.append('name', reportName);
    fd.append('location', reportLocation);
    fd.append('details', reportDetails);

    // Add photo file if present
    const photoInput = document.getElementById('dogPhoto');
    if (photoInput && photoInput.files && photoInput.files[0]) {
      fd.append('photo', photoInput.files[0]);
    }

    try {
      console.log('Submitting report:', { name: reportName, location: reportLocation, details: reportDetails });
      const res = await fetch(API + "/report", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Server error: " + res.status);
      const result = await res.json();

      // server may return the saved report and/or a photoUrl where it stored the file
      const submitted = result.report || {
        name: name,
        location: location,
        details: details,
        photo: result.photoUrl || null
      };

      console.log('Report submission response:', submitted);
      showSubmitConfirmation(submitted);
      reportForm.reset();
      document.getElementById('reportPreview')?.classList.remove('show');

      // reload reports after a short delay so new report appears
      setTimeout(loadReports, 1200);
    } catch (err) {
      alert("Error submitting report: " + err.message);
      console.error('Submission error:', err);
    }
  });
}

// Setup form when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupReportForm);
} else {
  setupReportForm();
}

/* ADMIN ACTIONS */
async function resolve(id) {
  await fetch(API + "/resolve/" + id, { method: "PUT", headers: ADMIN_HEADER });
  loadReports();
}
async function del(id) {
  await fetch(API + "/report/" + id, { method: "DELETE", headers: ADMIN_HEADER });
  loadReports();
}

/* LOAD RESCUED DOGS */
async function loadDogs() {
  const res = await fetch(API + "/rescued");
  const dogs = await res.json();
  const select = document.getElementById("dogSelect");
  if (!select) return;
  select.innerHTML = "";
  dogs.forEach(d => select.innerHTML += `<option>${d.location}</option>`);
}
loadDogs();

/* ADOPTION */
adoptForm?.addEventListener("submit", async e => {
  e.preventDefault();
  await fetch(API + "/adopt", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adopterName: adopterName.value,
      adopterEmail: adopterEmail?.value || "",
      adopterPhone: adopterPhone?.value || "",
      dogLocation: dogSelect.value,
      details: adoptDetails.value
    })
  });
  alert("✅ Request sent to admin! We'll review your application soon.");
  adoptForm.reset();
});

/* LOAD ADOPTION REQUESTS */
async function loadAdoptions() {
  const res = await fetch(API + "/adopt", { headers: ADMIN_HEADER });
  const data = await res.json();
  const list = document.getElementById("adoptRequests");
  if (!list) return;
  list.innerHTML = "";
  data.forEach(a => {
    list.innerHTML += `<li>
   <strong>👤 ${a.adopterName}</strong><br>
   📧 ${a.adopterEmail || "N/A"} | 📱 ${a.adopterPhone || "N/A"}<br>
   🐕 Dog Location: ${a.dogLocation}<br>
   💬 ${a.details}
   </li>`;
  });
}
loadAdoptions();

/* SHOW REPORT DETAILS */
function showReportDetails(id) {
  const report = reportsData.find(r => r._id === id);
  if (!report) return;

  const modal = document.getElementById("reportModal");
  if (modal) {
    let photoHTML = '';
    const photoSrc = report.photoUrl || report.photo || report.file;
    if (photoSrc) {
      photoHTML = `<div style="margin: 20px 0;">
    <strong>📸 Photo:</strong>
    <img src="${photoSrc}" style="max-width: 100%; max-height: 400px; border-radius: 8px; margin-top: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
   </div>`;
    }
    const displayLocation = report.location || 'Not Specified';
    const displayName = report.name || 'Anonymous';
    const displayDetails = report.details || 'No details provided';
    const displayStatus = report.status || 'Pending';
    document.getElementById("modalBody").innerHTML = `
   <div style="padding: 20px 0;">
    <p><strong>📍 Location:</strong> ${displayLocation}</p>
    <p><strong>👤 Reported By:</strong> ${displayName}</p>
    <p><strong>📝 Details:</strong> ${displayDetails}</p>
    <p><strong>Status:</strong> <span class="${displayStatus === 'Pending' ? 'pending' : 'resolved'}">${displayStatus}</span></p>
    ${photoHTML}
   </div>
  `;
    modal.style.display = "block";
  }
}

/* CLOSE REPORT DETAILS MODAL */
function closeReportModal() {
  const modal = document.getElementById("reportModal");
  if (modal) {
    modal.style.display = "none";
  }
}

/* SHOW SUBMIT CONFIRMATION */
function showSubmitConfirmation(data) {
  const modal = document.getElementById("reportModal");
  if (modal) {
    let photoHTML = '';
    const photoSrc = data.photoUrl || data.photo || data.file;
    if (photoSrc) {
      photoHTML = `<div style="margin: 20px 0;">
    <strong>📸 Photo:</strong>
    <img src="${photoSrc}" style="max-width: 100%; max-height: 300px; border-radius: 8px; margin-top: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
   </div>`;
    }
    const displayLocation = data.location || 'Not Specified';
    const displayName = data.name || 'Anonymous';
    const displayDetails = data.details || 'No details provided';
    document.getElementById("modalTitle").textContent = "✅ Report Submitted Successfully";
    document.getElementById("modalBody").innerHTML = `
   <div style="padding: 20px 0; color: white;">
    <p style="color: black;"><strong>📍 Location:</strong> ${displayLocation}</p>
    <p style="color: black;"><strong>👤 Reported By:</strong> ${displayName}</p>
    <p style="color: black;"><strong>📝 Details:</strong> ${displayDetails}</p>
    ${photoHTML}
    <p style="margin-top: 20px; color: black; font-weight: bold;">Thank you for reporting! Your report is being saved... 🐾</p>
   </div>
  `;
    modal.style.display = "block";

    // Auto close after 7 seconds to allow time for report update
    setTimeout(() => {
      modal.style.display = "none";
      document.getElementById("modalTitle").textContent = "Report Details";
    }, 7000);
  } else {
    alert("✅ Report submitted successfully! Photo and details saved. Thank you for helping.");
  }
}

/* Close modal when clicking outside */
window.onclick = function (event) {
  const modal = document.getElementById("reportModal");
  if (modal && event.target === modal) {
    modal.style.display = "none";
  }
}



function previewImage(input, previewId) {
  const preview = document.getElementById(previewId);

  if (input.files && input.files[0]) {
    const reader = new FileReader();

    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = "block";
    };

    reader.readAsDataURL(input.files[0]);
  }
}