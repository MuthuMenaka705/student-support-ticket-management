import { useEffect, useState } from "react";

import api from "../services/api";

export default function ManagerDashboard() {

  const [dashboard, setDashboard] = useState({});

  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {

    try {

      const [
        dashboardResponse,
        ticketsResponse,
      ] = await Promise.all([

        api.get(
          "/tickets/tickets/dashboard/"
        ),

        api.get(
          "/tickets/tickets/"
        ),

      ]);

      setDashboard(
        dashboardResponse.data
      );

      setTickets(
        ticketsResponse.data
      );

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    loadDashboard();

  }, []);

  const logout = () => {

    localStorage.clear();

    window.location.href = "/";

  };

  if (loading) {

    return (
      <div className="page">

        <div className="container">

          Loading manager dashboard...

        </div>

      </div>
    );

  }

  return (
    <div className="page">

      <header className="topbar">

        <div>

          <h2>
            Manager Dashboard
          </h2>

          <p>
            Support operations overview
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
            title="Total Tickets"
            value={dashboard.total}
          />

          <Stat
            title="Active"
            value={dashboard.active}
          />

          <Stat
            title="Resolved"
            value={dashboard.resolved}
          />

          <Stat
            title="Closed"
            value={dashboard.closed}
          />

          <Stat
            title="Overdue"
            value={dashboard.overdue}
          />

          <Stat
            title="Urgent"
            value={dashboard.urgent}
          />

          <Stat
            title="Escalated"
            value={dashboard.escalated}
          />

        </div>

        <section className="report-card">

          <h2>
            Tickets by Status
          </h2>

          <div className="report-list">

            {dashboard.by_status?.map(
              (item) => (

                <div
                  className="report-row"
                  key={item.status}
                >

                  <span>
                    {item.status}
                  </span>

                  <strong>
                    {item.count}
                  </strong>

                </div>

              )
            )}

          </div>

        </section>

        <section className="report-card">

          <h2>
            Tickets by Priority
          </h2>

          <div className="report-list">

            {dashboard.by_priority?.map(
              (item) => (

                <div
                  className="report-row"
                  key={item.priority}
                >

                  <span>
                    {item.priority}
                  </span>

                  <strong>
                    {item.count}
                  </strong>

                </div>

              )
            )}

          </div>

        </section>

        <section className="report-card">

          <h2>
            Tickets by Category
          </h2>

          <div className="report-list">

            {dashboard.by_category?.map(
              (item, index) => (

                <div
                  className="report-row"
                  key={index}
                >

                  <span>
                    {item.category__name ||
                      "Uncategorized"}
                  </span>

                  <strong>
                    {item.count}
                  </strong>

                </div>

              )
            )}

          </div>

        </section>

        <section className="report-card">

          <h2>
            Workload by Staff
          </h2>

          <div className="report-list">

            {dashboard.by_staff?.map(
              (item) => (

                <div
                  className="report-row"
                  key={item.assigned_to__username}
                >

                  <span>
                    {item.assigned_to__username}
                  </span>

                  <strong>
                    {item.count}
                  </strong>

                </div>

              )
            )}

          </div>

        </section>

        <section className="report-card">

          <h2>
            Active Ticket Overview
          </h2>

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>ID</th>
                  <th>Title</th>
                  <th>Student</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Age</th>
                  <th>SLA</th>

                </tr>

              </thead>

              <tbody>

                {tickets
                  .filter(
                    (ticket) =>
                      ![
                        "RESOLVED",
                        "CLOSED"
                      ].includes(
                        ticket.status
                      )
                  )
                  .map((ticket) => (

                    <tr key={ticket.id}>

                      <td>
                        #{ticket.id}
                      </td>

                      <td>
                        {ticket.title}
                      </td>

                      <td>
                        {ticket.student_name}
                      </td>

                      <td>
                        {ticket.priority}
                      </td>

                      <td>
                        {ticket.status}
                      </td>

                      <td>
                        {ticket.ageing_label}
                      </td>

                      <td>

                        {ticket.is_overdue ? (
                          <span className="overdue">
                            OVERDUE
                          </span>
                        ) : (
                          "Within SLA"
                        )}

                      </td>

                    </tr>

                  ))}

              </tbody>

            </table>

          </div>

        </section>

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