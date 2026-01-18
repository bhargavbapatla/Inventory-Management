import { useFormik } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import TextField from "../../components/TextField";

const Signup = () => {
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
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), undefined], "Passwords must match")
        .required("Confirm Password is required"),
    }),
    onSubmit: (values) => {
      // handle signup with values
      console.log("Signup values:", values);
    },
  });

  return (
    <div className="bg-white p-8 rounded shadow-md w-96">
      <div className="mb-4">
        <Link to="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600">
          <span className="mr-2">←</span>
          Back to Login
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
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

        <div className="flex justify-center">
          <button
            type="submit"
            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
};

export default Signup;
