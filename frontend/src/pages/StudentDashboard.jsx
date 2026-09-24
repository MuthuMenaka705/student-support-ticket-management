import { Link, useNavigate } from "react-router-dom";

export default function StudentDashboard() {

  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const logout = () => {

    localStorage.clear();

    navigate("/");

  };

  return (
    <div className="page">

      <header className="topbar">

        <div>
          <h2>Student Support Portal</h2>

          <p>
            Welcome, {user.username}
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

        <div className="hero-card">

          <h1>
            How can we help you?
          </h1>

          <p>
            Raise and track your college support requests.
          </p>

        </div>

        <div className="card-grid">

          <Link
            className="menu-card"
            to="/student/create"
          >
            <h3>➕ Raise Ticket</h3>

            <p>
              Create a new support request.
            </p>
          </Link>

          <Link
            className="menu-card"
            to="/student/tickets"
          >
            <h3>📋 My Tickets</h3>

            <p>
              View your requests and updates.
            </p>
          </Link>

        </div>

      </main>

    </div>
  );
}