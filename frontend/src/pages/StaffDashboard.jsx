import { useEffect, useState } from "react";

import api from "../services/api";

export default function StaffDashboard() {

  const [tickets, setTickets] = useState([]);

  const [staff, setStaff] = useState([]);

  const [dashboard, setDashboard] = useState({});

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    overdue: "",
    escalated: "",
  });

  const loadData = async () => {

    try {

      const params = {};

      Object.entries(filters).forEach(
        ([key, value]) => {
          if (value) {
            params[key] = value;
          }
        }
      );

      const [
        ticketsResponse,
        staffResponse,
        dashboardResponse,
      ] = await Promise.all([

        api.get(
          "/tickets/tickets/",
          { params }
        ),

        api.get(
          "/accounts/staff/"
        ),

        api.get(
          "/tickets/tickets/dashboard/"
        ),

      ]);

      setTickets(
        ticketsResponse.data
      );

      setStaff(
        staffResponse.data
      );

      setDashboard(
        dashboardResponse.data
      );

    } catch (err) {

      console.error(err);

    }

  };

  useEffect(() => {

    loadData();

  }, [
    filters.search,
    filters.status,
    filters.priority,
    filters.overdue,
    filters.escalated
  ]);

  const assignTicket = async (
    ticketId,
    staffId
  ) => {

    if (!staffId) return;

    try {

      await api.post(
        `/tickets/tickets/${ticketId}/assign/`,
        {
          assigned_to: staffId,
        }
      );

      loadData();

    } catch (err) {

      alert(
        err.response?.data?.error ||
        "Unable to assign ticket."
      );

    }
  };

  const updateStatus = async (
    ticket,
    newStatus
  ) => {

    let resolution = "";
    let pending_reason = "";

    if (newStatus === "RESOLVED") {

      resolution = window.prompt(
        "Enter resolution:"
      );

      if (!resolution) return;

    }

    if (newStatus === "PENDING") {

      pending_reason = window.prompt(
        "Why is this ticket pending?"
      );

      if (!pending_reason) return;

    }

    try {

      await api.post(
        `/tickets/tickets/${ticket.id}/update_status/`,
        {
          status: newStatus,
          resolution,
          pending_reason,
        }
      );

      loadData();

    } catch (err) {

      alert(
        err.response?.data?.error ||
        "Unable to update status."
      );

    }
  };

  const addComment = async (ticketId) => {

    const message = window.prompt(
      "Enter comment:"
    );

    if (!message) return;

    try {

      await api.post(
        `/tickets/tickets/${ticketId}/comment/`,
        {
          message,
        }
      );

      loadData();

    } catch (err) {

      alert(
        "Unable to add comment."
      );

    }
  };

  const escalate = async (ticketId) => {

    try {

      await api.post(
        `/tickets/tickets/${ticketId}/escalate/`
      );

      loadData();

    } catch (err) {

      alert(
        err.response?.data?.error ||
        "Unable to escalate ticket."
      );

    }
  };

  const logout = () => {

    localStorage.clear();

    window.location.href = "/";

  };

  return (
    <div className="page">

      <header className="topbar">

        <div>

          <h2>
            Staff Dashboard
          </h2>

          <p>
            Ticket operations
          </p>

        </div>

        <button
          className="secondary-btn"
          onClick={logout}
        >
          Logout
        </button>

      </header>

      <main className="container">

        <div className="stats-grid">

          <Stat
            title="Total"
            value={dashboard.total}
          />

          <Stat
            title="Active"
            value={dashboard.active}
          />

          <Stat
            title="Urgent"
            value={dashboard.urgent}
          />

          <Stat
            title="Overdue"
            value={dashboard.overdue}
          />

          <Stat
            title="Escalated"
            value={dashboard.escalated}
          />

        </div>

        <div className="filter-card">

          <input
            placeholder="Search tickets..."
            value={filters.search}
            onChange={(e) =>
              setFilters({
                ...filters,
                search: e.target.value,
              })
            }
          />

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value,
              })
            }
          >

            <option value="">
              All Status
            </option>

            <option value="OPEN">
              Open
            </option>

            <option value="ASSIGNED">
              Assigned
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="RESOLVED">
              Resolved
            </option>

            <option value="CLOSED">
              Closed
            </option>

          </select>

          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({
                ...filters,
                priority: e.target.value,
              })
            }
          >

            <option value="">
              All Priority
            </option>

            <option value="LOW">
              Low
            </option>

            <option value="MEDIUM">
              Medium
            </option>

            <option value="HIGH">
              High
            </option>

            <option value="URGENT">
              Urgent
            </option>

          </select>

          <select
            value={filters.overdue}
            onChange={(e) =>
              setFilters({
                ...filters,
                overdue: e.target.value,
              })
            }
          >

            <option value="">
              All SLA
            </option>

            <option value="true">
              Overdue
            </option>

          </select>

          <select
            value={filters.escalated}
            onChange={(e) =>
              setFilters({
                ...filters,
                escalated: e.target.value,
              })
            }
          >

            <option value="">
              All Escalation
            </option>

            <option value="true">
              Escalated
            </option>

          </select>

        </div>

        {tickets.map((ticket) => (

          <TicketCard
            key={ticket.id}
            ticket={ticket}
            staff={staff}
            assignTicket={assignTicket}
            updateStatus={updateStatus}
            addComment={addComment}
            escalate={escalate}
          />

        ))}

      </main>

    </div>
  );
}


function Stat({ title, value }) {

  return (
    <div className="stat-card">

      <span>
        {title}
      </span>

      <strong>
        {value ?? 0}
      </strong>

    </div>
  );
}


function TicketCard({
  ticket,
  staff,
  assignTicket,
  updateStatus,
  addComment,
  escalate,
}) {

  return (
    <div className="ticket-card">

      <div className="ticket-header">

        <div>

          <h3>
            #{ticket.id} {ticket.title}
          </h3>

          <p>
            Student:{" "}
            <strong>
              {ticket.student_name}
            </strong>
          </p>

        </div>

        <span
          className={`badge status-${ticket.status}`}
        >
          {ticket.status}
        </span>

      </div>

      <p>
        {ticket.description}
      </p>

      <div className="ticket-meta">

        <span>
          Category:{" "}
          {ticket.category_name || "-"}
        </span>

        <span>
          Priority:{" "}
          {ticket.priority}
        </span>

        <span>
          Age:{" "}
          {ticket.ageing_label}
        </span>

        {ticket.is_overdue && (
          <span className="overdue">
            SLA OVERDUE
          </span>
        )}

      </div>

      <div className="staff-actions">

        <select
          value={ticket.assigned_to || ""}
          onChange={(e) =>
            assignTicket(
              ticket.id,
              e.target.value
            )
          }
        >

          <option value="">
            Assign Staff
          </option>

          {staff.map((person) => (

            <option
              key={person.id}
              value={person.id}
            >
              {person.username}
            </option>

          ))}

        </select>

        <select
          value=""
          onChange={(e) => {

            if (e.target.value) {

              updateStatus(
                ticket,
                e.target.value
              );

            }

          }}
        >

          <option value="">
            Change Status
          </option>

          <option value="IN_PROGRESS">
            In Progress
          </option>

          <option value="PENDING">
            Pending
          </option>

          <option value="RESOLVED">
            Resolved
          </option>

          <option value="CLOSED">
            Closed
          </option>

        </select>

        <button
          className="secondary-btn"
          onClick={() =>
            addComment(ticket.id)
          }
        >
          Comment
        </button>

        {!ticket.escalated &&
          !["RESOLVED", "CLOSED"].includes(
            ticket.status
          ) && (

          <button
            className="danger-btn"
            onClick={() =>
              escalate(ticket.id)
            }
          >
            Escalate
          </button>

        )}

      </div>

      {ticket.pending_reason && (

        <div className="warning-box">

          <strong>
            Pending reason:
          </strong>

          <p>
            {ticket.pending_reason}
          </p>

        </div>

      )}

      {ticket.resolution && (

        <div className="resolution">

          <strong>
            Resolution
          </strong>

          <p>
            {ticket.resolution}
          </p>

        </div>

      )}

    </div>
  );
}