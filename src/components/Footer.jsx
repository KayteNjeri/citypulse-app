import './Footer.css'

function Footer () {
    return (
        <footer className="footer">
            <div className="footer__content">
                <div className="footer__brand">
                    <span className="footer__logo" aria-hidden="true">
                        ●
                    </span>
                    <span>CityPulse</span>
                </div>

                <p className="footer__text">
                    Discover local events, activities and experiences happening around you!
                </p>

                <div className="footer__links">
                    <a href="#about-us">About Us</a>
                    <a href="#contact-us">Contact Us</a>
                    <a href="#privacy-policy">Privacy Policy</a>
                </div>
            </div>

            <div className="footer__bottom">
                <p>© {new Date(). getFullYear()} CityPulse. All rights reserved.</p>
                
                <div className="footer__bottom-links">
                    <a href="#terms">Terms</a>
                    <a href="#cookies">Cookies</a>
                </div>
            </div>
        </footer>
    )
}

export default Footer