import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

export default function CreateTicket() {

  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {

    api.get("/tickets/categories/")
      .then((response) => {
        setCategories(response.data);
      })
      .catch(() => {
        setMessage(
          "Unable to load categories."
        );
      });

  }, []);

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  const submitTicket = async (e) => {

    e.preventDefault();

    setMessage("");

    try {

      await api.post(
        "/tickets/tickets/",
        {
          title: form.title,
          description: form.description,
          category: form.category || null,
          priority: form.priority,
        }
      );

      setMessage(
        "Ticket created successfully."
      );

      setTimeout(() => {
        navigate("/student/tickets");
      }, 700);

    } catch (err) {

      setMessage(
        err.response?.data?.detail ||
        "Unable to create ticket."
      );

    }
  };

  return (
    <div className="page">

      <header className="topbar">

        <h2>Raise Support Ticket</h2>

        <button
          className="secondary-btn"
          onClick={() =>
            navigate("/student")
          }
        >
          Back
        </button>

      </header>

      <main className="container">

        <div className="form-card">

          <h2>Create New Ticket</h2>

          {message && (
            <div className="success">
              {message}
            </div>
          )}

          <form onSubmit={submitTicket}>

            <label>Title</label>

            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Example: ID card not received"
              required
            />

            <label>Category</label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >

              <option value="">
                Select category
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}

            </select>

            <label>Priority</label>

            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
            >
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

            <label>Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Explain your issue..."
              rows="7"
              required
            />

            <button className="primary-btn">
              Submit Ticket
            </button>

          </form>

        </div>

      </main>

    </div>
  );
}