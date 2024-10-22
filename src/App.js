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
  @media (max-width: 768px) {
    flex-direction: column; /* Stack content for small screens */
  }
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto; /* Make the content scrollable */
  padding: 2rem;
  margin-left: 350px; /* Leave space for the fixed sidebar */

  @media (max-width: 768px) {
    margin-left: 0;
    padding: 1rem;
  }
`;

const Section = styled.div`
  padding: 2rem 0; /* Reduced padding to lessen gap between sections */
  min-height: 90vh; /* Adjusted height to reduce any excessive gap */
  scroll-margin-top: 70px; /* Adjust this value to fine-tune the section alignment */
`;
