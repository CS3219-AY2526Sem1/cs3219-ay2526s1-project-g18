import AiFeedback from "./components/AiFeedback";

export default function AttemptHistory() {
    const codeAttempt = `Please store the code attempt string and pass to my AiFeedback component.`;
    const question = `Please store the question string and pass to my AiFeedback component.`;

    return <div className="bg-dark-blue-bg w-full h-screen flex flex-row justify-end">
        <AiFeedback codeAttempt={codeAttempt} question={question}/>
    </div>;
}