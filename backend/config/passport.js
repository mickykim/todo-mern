import passport from 'passport';
import LocalStrategy from 'passport-local';
import User from '../src/models/User.js';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import keys from './keys.js';

export default function passportConfig(passport) {
    // Function defined in use is called when 'passport.authenticate()' is called with the name as a parameter.
    passport.use(
        'register',
        new LocalStrategy(
            {
                usernameField: 'email', // Changes the name of the username parameter to email
                passwordField: 'password', // Changes the name of the password parameter (nothing here)
                passReqToCallback: true, // Passes req.body to the callback function
            },
            async (req, email, password, done) => {
                // req is accepted because of previous parameter option enabled
                try {
                    const existingUser = await User.findOne({ email });
                    if (!existingUser) {
                        // User does not exist
                        const user = new User({
                            email,
                            password,
                            first_name: req.body.firstName,
                            last_name: req.body.lastName,
                        });
                        const savedUser = await user.save();
                        return done(null, savedUser);
                    }
                    // User already exists
                    return done(null, false, {
                        message: 'User with the given email already exists',
                    });
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    passport.use(
        'login',
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password',
            },
            async (email, password, done) => {
                try {
                    const user = await User.findOne({ email });
                    if (!user) {
                        return done(null, false, { message: 'User not found' });
                    }
                    const validate = user.isValidPassword(password);
                    if (!validate) {
                        return done(null, false, {
                            message: 'Invalid Username or Password',
                        });
                    }

                    return done(null, user, { message: 'Login Successful' });
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    passport.use(
        new JwtStrategy({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: keys.JWT_SECRET,
        })
    );
}
