import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ForgotPassword from "../src/pages/FogotPassWord/ForgotPassword";
import axios from "axios";

vi.mock("axios"); // Mock axios
afterEach(cleanup);

test("should render the ForgotPassword component", () => {
  render(<ForgotPassword />);
  const testElement = screen.getByTestId("test_id-1");
  expect(testElement).not.to.be.null;
});

test("should show error when email field is empty", async () => {
  render(<ForgotPassword />);
  
  const button = screen.getByText("Send");
  fireEvent.click(button);

  expect(screen.getByText("Enter Email")).not.to.be.null;
});

test("should show error for invalid email", async () => {
  render(<ForgotPassword />);
  
  const input = screen.getByPlaceholderText("Enter Your Email");
  fireEvent.change(input, { target: { value: "invalid-email" } });

  const button = screen.getByText("Send");
  fireEvent.click(button);

  expect(screen.getByText("Email not valid")).not.to.be.null;
});

test("should call API when a valid email is entered", async () => {
  axios.post.mockResolvedValue({ status: 200 });

  render(<ForgotPassword />);

  const input = screen.getByPlaceholderText("Enter Your Email");
  fireEvent.change(input, { target: { value: "test@example.com" } });

  const button = screen.getByText("Send");
  fireEvent.click(button);

  expect(axios.post).toHaveBeenCalledWith(
    "ttps://new-sever.vercel.app/api/users/forgotpassword",
    { email: "test@example.com" }
  );
});

test("should show success message when email is sent", async () => {
  axios.post.mockResolvedValue({ status: 200 });

  render(<ForgotPassword />);

  const input = screen.getByPlaceholderText("Enter Your Email");
  fireEvent.change(input, { target: { value: "test@example.com" } });

  const button = screen.getByText("Send");
  fireEvent.click(button);

  expect(await screen.findByText("Email sent successfully!")).not.to.be.null;
});

test("should show error when email is not found", async () => {
  axios.post.mockRejectedValue({ response: { status: 404, data: { error: "Email not found" } } });

  render(<ForgotPassword />);

  const input = screen.getByPlaceholderText("Enter Your Email");
  fireEvent.change(input, { target: { value: "invalid@example.com" } });

  const button = screen.getByText("Send");
  fireEvent.click(button);

  expect(await screen.findByText("Email not found")).not.to.be.null;
});
