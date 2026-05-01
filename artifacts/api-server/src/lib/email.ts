import { Resend } from "resend";

let resendClient: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_ADDRESS = "CampusDesk <notifications@campusdesk.app>";

export async function sendComplaintAssignedToStaff(opts: {
  staffEmail: string;
  staffName: string;
  complaintTitle: string;
  complaintId: number;
  location: string | null;
  studentName: string;
}): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to: opts.staffEmail,
      subject: `New complaint assigned: ${opts.complaintTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:8px;">
          <h2 style="color:#1d4ed8;margin-bottom:8px;">New Complaint Assigned to You</h2>
          <p>Hi <strong>${opts.staffName}</strong>,</p>
          <p>A complaint has been assigned to you on CampusDesk. Please review and take action.</p>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0 0 8px;"><strong>Complaint #${opts.complaintId}:</strong> ${opts.complaintTitle}</p>
            ${opts.location ? `<p style="margin:0 0 8px;color:#6b7280;">Location: ${opts.location}</p>` : ""}
            <p style="margin:0;color:#6b7280;">Submitted by: ${opts.studentName}</p>
          </div>
          <p>Please log in to your CampusDesk staff portal to view full details and update the status.</p>
          <p style="margin-top:24px;color:#9ca3af;font-size:12px;">This is an automated notification from CampusDesk.</p>
        </div>
      `,
    });
  } catch (err) {
    // Email sending is non-critical — log and continue
    console.warn("Failed to send assignment email:", err);
  }
}

export async function sendComplaintAssignedToStudent(opts: {
  studentEmail: string;
  studentName: string;
  complaintTitle: string;
  complaintId: number;
  staffName: string;
}): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to: opts.studentEmail,
      subject: `Your complaint is being handled: ${opts.complaintTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:8px;">
          <h2 style="color:#1d4ed8;margin-bottom:8px;">Your Complaint Is Being Handled</h2>
          <p>Hi <strong>${opts.studentName}</strong>,</p>
          <p>Good news — your complaint has been assigned to a staff member who will resolve it.</p>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0 0 8px;"><strong>Complaint #${opts.complaintId}:</strong> ${opts.complaintTitle}</p>
            <p style="margin:0;color:#6b7280;">Assigned to: ${opts.staffName}</p>
            <p style="margin:4px 0 0;color:#059669;font-weight:600;">Status: In Progress</p>
          </div>
          <p>You'll receive another email when your complaint is resolved.</p>
          <p style="margin-top:24px;color:#9ca3af;font-size:12px;">This is an automated notification from CampusDesk.</p>
        </div>
      `,
    });
  } catch (err) {
    console.warn("Failed to send student assignment email:", err);
  }
}

export async function sendStatusUpdateToStudent(opts: {
  studentEmail: string;
  studentName: string;
  complaintTitle: string;
  complaintId: number;
  newStatus: string;
}): Promise<void> {
  const client = getClient();
  if (!client) return;

  const statusLabel = opts.newStatus === "resolved" ? "Resolved" : opts.newStatus === "in_progress" ? "In Progress" : "Pending";
  const statusColor = opts.newStatus === "resolved" ? "#059669" : opts.newStatus === "in_progress" ? "#d97706" : "#6b7280";

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to: opts.studentEmail,
      subject: `Complaint status update: ${opts.complaintTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:8px;">
          <h2 style="color:#1d4ed8;margin-bottom:8px;">Complaint Status Updated</h2>
          <p>Hi <strong>${opts.studentName}</strong>,</p>
          <p>The status of your complaint has been updated.</p>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0 0 8px;"><strong>Complaint #${opts.complaintId}:</strong> ${opts.complaintTitle}</p>
            <p style="margin:0;"><span style="color:#6b7280;">New Status: </span><span style="color:${statusColor};font-weight:600;">${statusLabel}</span></p>
          </div>
          ${opts.newStatus === "resolved" ? `<p>Your complaint has been resolved! If you're satisfied, please log in to leave feedback. Your input helps us improve.</p>` : `<p>Log in to CampusDesk to track the progress of your complaint.</p>`}
          <p style="margin-top:24px;color:#9ca3af;font-size:12px;">This is an automated notification from CampusDesk.</p>
        </div>
      `,
    });
  } catch (err) {
    console.warn("Failed to send status update email:", err);
  }
}
