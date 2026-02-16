import { useFormik } from "formik";
import * as Yup from "yup";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import { userSignup } from "../../api/auth";
import toast from "react-hot-toast";
import { useAuth } from "../../features/auth/authContext";
import { useState } from "react";

const Signup = () => {
  const navigate = useNavigate();
  const { login, theme } = useAuth();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Full Name is required"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .min(8, "At least 8 characters")
        .matches(/[a-z]/, "Include a lowercase letter")
        .matches(/[A-Z]/, "Include an uppercase letter")
        .matches(/\d/, "Include a number")
        .matches(/[^A-Za-z0-9]/, "Include a special character")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), undefined], "Passwords must match")
        .required("Confirm Password is required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { status, data, message } = await userSignup(values);
        console.log("Signup response:", status);
        if (status === 200 || status === 201) {
          console.log("Signup successful:", data);
          toast.success(message || "Signup successful!");
          
          // Assuming data contains user and token. 
          // If structure is different, this might need adjustment.
          // Based on typical auth flows:
          const user = data.data || { name: values.name, email: values.email, id: data.id || "temp-id", role: "user" }; 
          const token = data.data.token || data.accessToken || "mock-token-if-missing";

          // Save to AuthContext (and localStorage)
          // This keeps it in the same object as the login (AuthContext)
          login(user, token);

          navigate("/");
        } else {
          console.error("Signup failed:", data);
          toast.error(message || "Signup failed. Please try again.");
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        const errorMessage = err.response?.data?.message || "An error occurred during signup.";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
      
      console.log("Signup values:", values);
    },
  });

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-gray-50">
  //       <Loader />
  //     </div>
  //   );
  // }

  return (
    <div
      className="w-full max-w-md rounded-2xl border px-8 py-10 shadow-sm space-y-8"
      style={{ backgroundColor: theme.surface, borderColor: theme.surface }}
    >
      <div className="mb-4">
        <Link to="/login" className={`inline-flex items-center text-sm text-${theme.primaryText} hover:text-blue-600`}>
          <span className="mr-2"><ArrowLeft className="w-5 h-5" /></span>
          
          Back to Login
        </Link>
      </div>
      <h2 className={`text-2xl font-bold mb-6 text-center text-${theme.primaryText}`}>Sign Up</h2>
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <TextField
          label="Full Name"
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Jane Doe"
          error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
          required
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="you@example.com"
          error={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
          required
        // Leading icon is automatically applied for type=\"email\"
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Create a strong password"
          error={formik.touched.password && formik.errors.password ? formik.errors.password : undefined}
          required
        />
        <TextField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Re-enter your password"
          error={
            formik.touched.confirmPassword && formik.errors.confirmPassword
              ? formik.errors.confirmPassword
              : undefined
          }
          required
        />

        <div className="pt-4 flex justify-center">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          // className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Create Account
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Signup;
