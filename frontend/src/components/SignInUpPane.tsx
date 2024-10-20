import { GoogleLogin } from "@react-oauth/google";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toastError, toastSuccess, toastWarn } from "../toasts";

const SignInUpPane = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const hash = async (str: string): Promise<string> => {
            const utf8 = new TextEncoder().encode(str);
            const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray
                .map((bytes) => bytes.toString(16).padStart(2, "0"))
                .join("");
            return hashHex;
        };

        const formData = new FormData(e.target as HTMLFormElement);
        const email = formData.get("email") as string;
        const pwd = await hash(formData.get("pwd") as string);

        if (isSignUp) {
            const name = formData.get("name") as string;
            const confirmPwd = await hash(formData.get("confirmPwd") as string);

            if (pwd !== confirmPwd) {
                toastWarn("Passwords do not match!");
                return;
            }

            fetch(`${import.meta.env.VITE_BACKEND_URL}/user/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, pwd }),
            })
                .then((res) => {
                    if (res.status === 201) {
                        toastSuccess("Registration successful!");
                        navigate("/dashboard");
                    } else if (res.status === 409) {
                        toastWarn("User already exists!");
                    } else {
                        toastError("Something went wrong");
                    }
                })
                .catch((e) => {
                    toastError("Something went wrong");
                    console.log(e);
                });
        } else {
            fetch(`${import.meta.env.VITE_BACKEND_URL}/user/login/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, pwd }),
            })
                .then((res) => {
                    if (res.status === 401) {
                        toastWarn("Wrong Credentials");
                        (e.target as HTMLFormElement).reset();
                    } else if (res.status === 200) {
                        navigate("/dashboard");
                    } else if (res.status === 404) {
                        toastError("User not found");
                    } else {
                        toastError("Something went wrong");
                    }
                })
                .catch((e) => {
                    toastError("Something went wrong");
                    console.log(e);
                });
        }
    };

    return (
        <div className="SignInUpPane flex flex-col items-center w-3/4 shadow-lg bg-gray-50 text-gray-900 p-3">
            <span className="text-3xl mb-3">{isSignUp ? "Sign Up" : "Sign In"}</span>
            <div className="inputArea w-full grow p-5">
                <div className="flex flex-col w-full h-full">
                    <GoogleLogin
                        text={isSignUp?"signup_with":"signin_with"}
                        onSuccess={credentialResponse => {
                            console.log(credentialResponse);
                        }}
                        onError={() => {
                            toastError("Something went wrong!")
                            toastError("Something went wrong")
                            console.log('Login Failed');
                        }}
                    />
                    <div className="flex flex-col items-center mt-4">
                        {isSignUp ? (
                            <>
                                <a className="text-sm mb-2 hover:underline hover:cursor-pointer" onClick={() => setIsSignUp(false)}>
                                    Already A User?
                                </a>
                            </>
                        ) : (
                            <>
                                <a className="text-sm mb-2 hover:underline hover:cursor-pointer" onClick={() => setIsSignUp(true)}>
                                    New User?
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignInUpPane;
