import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export function errorHandler(
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
) {
    const statusCode = error.statusCode || 500;
    request.log.error(error);

    reply.status(statusCode).send({
        success: false,
        message: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
}
