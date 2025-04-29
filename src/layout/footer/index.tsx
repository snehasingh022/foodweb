import Link from 'next/link';
import { Col, Row } from 'antd';

const Footer = () => {

  return (
    <footer className="bg-white dark:bg-[#1B1E2B] pt-5 px-[30px] pb-[18px] w-full shadow-[0_-5px_10px_rgba(146,153,184,0.05)]">
      <Row>
        <Col md={12} xs={24}>
          <span className="inline-block w-full font-medium admin-footer__copyright md:text-center text-theme-gray dark:text-white/60 md:mb-[10px]">
            © 2025
            <span className="mx-[4px] text-black">
              Parthvi Travles
            </span>
          </span>
        </Col>
        
      </Row>
    </footer>
  );
};

export default Footer;
