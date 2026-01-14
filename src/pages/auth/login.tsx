import { Field, FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import TextField from '../../components/TextField';
import Button from '../../components/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/authContext';
import { useState } from 'react';

const Login = () => {
  const {login} = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .required('Password is required'),
    }),
    onSubmit: (values) => {
      // handle login submit with values.email and values.password
      console.log('Login values:', values);
      const mockUser = { id: '1', name: 'Mom', email: 'mom@bakery.com', role: 'user' };
      const mockToken = 'abc-123-xyz';

      login(mockUser, mockToken);

    },
  });

  console.log('formik:', formik);
  return (
    <div className="bg-white p-8 rounded shadow-md w-96">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <FormikProvider value={formik}>
          <Field name="email" >
            {({ field, form, meta }) => (<>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="you@example.com"
                error={meta.touched && meta.error ? meta.error : undefined}
                required
              />
              <>{console.log('meta:', meta)}</>
            </>)}
          </Field>

          <Field name="password" >
            {({ field, form, meta }) => (
              <TextField
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter your password"
                error={meta.touched && meta.error ? meta.error : undefined}
                required
                trailingIcon={
                  showPassword ? (
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Zm9 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m3 3 18 18M6.5 6.5C4.5 8 3 10.3 3 12c0 0 3.5 7 9 7 2 0 3.7-.6 5.1-1.5m2.4-2.4C20.8 13.7 21 12 21 12s-3.5-7-9-7c-1.6 0-3 .5-4.3 1.3M10 10a3 3 0 0 0 4 4"/>
                    </svg>
                  )
                }
                onTrailingIconClick={() => setShowPassword((v) => !v)}
              />
            )}
          </Field>


        </FormikProvider>



        <div className="flex justify-center">
          <Button
            type="submit"
            onClick={() => formik.handleSubmit()}
          >
            Login
          </Button>
        </div>
        <p className="text-sm text-gray-600 text-center">
          dont have an account ?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline">
            sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
