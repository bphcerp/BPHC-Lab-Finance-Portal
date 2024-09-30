import { Button, Label, TextInput } from "flowbite-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

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
                alert("Passwords do not match!");
                return;
            }

            // Sign up request
            fetch(`${import.meta.env.VITE_BACKEND_URL}/user/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, pwd }),
            })
                .then((res) => {
                    if (res.status === 201) {
                        alert("Registration successful!");
                        navigate("/dashboard");
                    } else if (res.status === 409) {
                        alert("User already exists!");
                    } else {
                        alert("Something went wrong");
                    }
                })
                .catch((e) => {
                    alert("Something went wrong");
                    console.log(e);
                });
        } else {
            // Sign in request
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
                        alert("Wrong Credentials");
                        (e.target as HTMLFormElement).reset();
                    } else if (res.status === 200) {
                        navigate("/dashboard");
                    } else if (res.status === 404) {
                        alert("User not found");
                    } else {
                        alert("Something went wrong");
                    }
                })
                .catch((e) => {
                    alert("Something went wrong");
                    console.log(e);
                });
        }
    };

    return (
        <div className="SignInUpPane flex flex-col items-center w-3/4 shadow-lg bg-gray-50 text-gray-900 p-3">
            <span className="text-3xl mb-3">{isSignUp ? "Sign Up" : "Sign In"}</span>
            <div className="inputArea w-full grow p-5">
                <div className="flex flex-col w-full h-full">
                    <form onSubmit={handleSubmit}>
                        {isSignUp && (
                            <>
                                <Label className="text-base" htmlFor="name">Name</Label>
                                <TextInput className="mt-2 mb-6" id="name" name="name"  required/>
                            </>
                        )}
                        <Label className="text-base" htmlFor="email">Email</Label>
                        <TextInput className="mt-2 mb-6" id="email" name="email" required/>
                        <Label className="text-base" htmlFor="pwd">Password</Label>
                        <TextInput type="password" className="mt-2 mb-4" id="pwd" name="pwd" required />
                        {isSignUp && (
                            <>
                                <Label className="text-base" htmlFor="confirmPwd">Confirm Password</Label>
                                <TextInput type="password" className="mt-2 mb-4" id="confirmPwd" name="confirmPwd" required />
                            </>
                        )}
                        <div className="flex justify-center">
                            <Button type="submit" className="w-28" color="blue">
                                {isSignUp ? "Sign Up" : "Sign In"}
                            </Button>
                        </div>
                    </form>
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
