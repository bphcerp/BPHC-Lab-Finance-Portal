import { FunctionComponent } from "react";

interface Developer {
    id: string;
    name: string;
    email: string;
}

const developers: Developer[] = [
    { id: "2022AAPS0274H", name: "Pranav Poluri", email: "f20220274@hyderabad.bits-pilani.ac.in" },
    { id: "2021B5AA2542H", name: "Arnav Jain", email: "f20212542@hyderabad.bits-pilani.ac.in" },
];

const DeveloperPage: FunctionComponent = () => {
    return (
        <div className="flex flex-col items-center w-full h-full p-5">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-4">Developers</h1>
            <p className="text-lg text-gray-700 text-center max-w-2xl mb-8">
                We are the developers behind this platform. If you have any questions, suggestions, 
                or need support, feel free to reach out to us. Your feedback is appreciated.
            </p>

            <div className="flex flex-wrap justify-center gap-6">
                {developers.map((developer) => (
                    <div
                        key={developer.id}
                        className="bg-white shadow-lg rounded-lg p-10 w-full max-w-xs border border-gray-200 hover:shadow-xl transition-shadow duration-300"
                    >
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">{developer.name}</h3>
                        <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium text-gray-800">ID:</span> {developer.id}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-800">Email:</span>{" "}
                            <a
                                href={`mailto:${developer.email}`}
                                className="text-blue-600 hover:underline"
                            >
                                {developer.email}
                            </a>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeveloperPage;
