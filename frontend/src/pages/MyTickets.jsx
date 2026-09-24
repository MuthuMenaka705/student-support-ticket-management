import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

export default function MyTickets() {

  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);

  const [commentText, setCommentText] = useState({});

  const loadTickets = async () => {

    try {

      const response = await api.get(
        "/tickets/tickets/"
      );

      setTickets(response.data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    loadTickets();

  }, []);

  const addComment = async (ticketId) => {

    const message = (
      commentText[ticketId] || ""
    ).trim();

    if (!message) return;

    try {

      await api.post(
        `/tickets/tickets/${ticketId}/comment/`,
        {
          message,
        }
      );

      setCommentText({
        ...commentText,
        [ticketId]: "",
      });

      loadTickets();

    } catch (err) {

      alert(
        err.response?.data?.error ||
        "Unable to add comment."
      );

    }
  };

  const reopen = async (ticketId) => {

    try {

      await api.post(
        `/tickets/tickets/${ticketId}/reopen/`
      );

      loadTickets();

    } catch (err) {

      alert(
        err.response?.data?.error ||
        "Unable to reopen ticket."
      );

    }
  };

  if (loading) {

    return (
      <div className="page">
        <div className="container">
          Loading tickets...
        </div>
      </div>
    );

  }

  return (
    <div className="page">

      <header className="topbar">

        <h2>My Tickets</h2>

        <button
          className="secondary-btn"
          onClick={() =>
            navigate("/student")
          }
        >
          Dashboard
        </button>

      </header>

      <main className="container">

        {tickets.length === 0 ? (

          <div className="empty-card">
            <h3>No tickets yet</h3>

            <p>
              Create your first support ticket.
            </p>

          </div>

        ) : (

          tickets.map((ticket) => (

            <div
              className="ticket-card"
              key={ticket.id}
            >

              <div className="ticket-header">

                <div>

                  <h3>
                    #{ticket.id} {ticket.title}
                  </h3>

                  <p className="muted">
                    {ticket.category_name ||
                      "Uncategorized"}
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
                  Priority:{" "}
                  <strong>
                    {ticket.priority}
                  </strong>
                </span>

                <span>
                  Age:{" "}
                  {ticket.ageing_label}
                </span>

                {ticket.is_overdue && (
                  <span className="overdue">
                    OVERDUE
                  </span>
                )}

              </div>

              {ticket.assigned_to_name && (
                <p>
                  Assigned to:{" "}
                  <strong>
                    {ticket.assigned_to_name}
                  </strong>
                </p>
              )}

              {ticket.resolution && (
                <div className="resolution">
                  <strong>
                    Resolution:
                  </strong>

                  <p>
                    {ticket.resolution}
                  </p>
                </div>
              )}

              <div className="comments">

                <h4>Conversation</h4>

                {ticket.comments?.map(
                  (comment) => (

                    <div
                      className="comment"
                      key={comment.id}
                    >

                      <strong>
                        {comment.user_name}
                      </strong>

                      <span>
                        {comment.message}
                      </span>

                    </div>

                  )
                )}

                <div className="comment-box">

                  <input
                    value={
                      commentText[ticket.id] || ""
                    }
                    onChange={(e) =>
                      setCommentText({
                        ...commentText,
                        [ticket.id]:
                          e.target.value,
                      })
                    }
                    placeholder="Add a comment..."
                  />

                  <button
                    className="primary-btn small"
                    onClick={() =>
                      addComment(ticket.id)
                    }
                  >
                    Send
                  </button>

                </div>

              </div>

              {[
                "RESOLVED",
                "CLOSED",
              ].includes(ticket.status) && (

                <button
                  className="secondary-btn"
                  onClick={() =>
                    reopen(ticket.id)
                  }
                >
                  Reopen Ticket
                </button>

              )}

            </div>

          ))

        )}

      </main>

    </div>
  );
}