import EmailChips from "./components/EmailInputs";
import z from "zod";

function App() {
  return (
    <div className="w-screen p-4">
      <div className="mx-auto max-w-80">
        <EmailChips
          limit={5}
          limitMessage="You've reached the email limit"
          required
          requiredMessage="Email is required"
          validateEmail={(email) => z.string().email().safeParse(email).success}
          onChipChange={(chips) => {
            console.log(chips);
          }}
        />
      </div>
    </div>
  );
}

export default App;
