import styled from 'styled-components';
import Projects from './components/Projects';
import About from './components/About';
import Experience from './components/Experience';
import Sidebar from './components/Sidebar';
import { GlobalStyles } from './styles/GlobalStyles';

function App() {
  return (
    <>
      <GlobalStyles />
      <Container>
        <Sidebar />
        {/* Ensure this ID is correctly referenced in the sidebar for scrolling */}
        <MainContent id="scroll-container">
          <Section id="About">
            <About />
          </Section>
          <Section id="Experience">
            <Experience />
          </Section>
          <Section id="Projects">
            <Projects />
          </Section>
        </MainContent>
      </Container>
    </>
  );
}

export default App;

// Styled Components
const Container = styled.div`
  display: flex;
  height: 100vh;
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto; /* Ensure scrolling is active here */
  padding: 2rem;
  margin-left: 350px; /* Leave space for the fixed sidebar */
  background-color: #0a192f;
  color: #ccd6f6;
`;

const Section = styled.div`
  padding: 4rem 0;
  min-height: 100vh;
`;
